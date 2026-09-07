import { NextRequest, NextResponse } from 'next/server';
import { analyzeProductPackagingWithVlm, InputImagePart } from '@/lib/gemini';
import { getCurrentInspector } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const maxSizeBytes = 4 * 1024 * 1024;

function describeError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== 'object') {
    return { message: String(error) };
  }

  const candidate = error as Record<string, unknown>;
  return {
    status: candidate.status,
    statusText: candidate.statusText,
    code: candidate.code,
    message: candidate.message,
    details: candidate.details,
    name: candidate.name
  };
}

function hasValidImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  }

  return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
}

export async function POST(req: NextRequest) {
  try {
    const inspector = await getCurrentInspector();
    if (!inspector) {
      return NextResponse.json({ error: 'Unauthorized. Inspector session required.' }, { status: 401 });
    }

    const formData = await req.formData();
    const files: File[] = [];

    // Collect all image files from FormData
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Please upload a valid product image.' },
        { status: 400 }
      );
    }

    const inputImages: InputImagePart[] = [];
    const savedImagesInfo: Array<{ id: string; url: string; originalName: string; uploadedAt: string; viewType?: string }> = [];
    let totalSizeBytes = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate MIME type
      const mimeType = file.type.toLowerCase();
      if (!allowedMimeTypes.has(mimeType)) {
        return NextResponse.json(
          { error: `File "${file.name}" is not a supported format. Please upload JPEG, PNG, or WebP images.` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > maxSizeBytes) {
        return NextResponse.json(
          { success: false, error: `File "${file.name}" is too large (max 4MB).` },
          { status: 400 }
        );
      }

      totalSizeBytes += file.size;
      if (totalSizeBytes > maxSizeBytes) {
        return NextResponse.json(
          { success: false, error: 'The selected images are too large to process in one request (max 4MB total).' },
          { status: 413 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      if (!hasValidImageSignature(buffer, mimeType)) {
        return NextResponse.json(
          { success: false, error: `File "${file.name}" is not a valid ${mimeType === 'image/webp' ? 'WebP' : 'image'} file.` },
          { status: 400 }
        );
      }

      const base64Data = buffer.toString('base64');
      const sourceLabel = `image-${i + 1}`;

      inputImages.push({
        data: base64Data,
        mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
        sourceLabel
      });

      savedImagesInfo.push({
        id: sourceLabel,
        // The image is needed by the review viewer and PDF flow, but Vercel has no durable local uploads directory.
        url: `data:${mimeType};base64,${base64Data}`,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      });
    }

    // Pass real product images to Gemini VLM
    console.log('[MetrologyAI] Image received', { count: inputImages.length, totalSizeBytes });
    console.log('[MetrologyAI] Sending images to Gemini', inputImages.map((image) => ({
      mimeType: image.mimeType,
      imageBytes: Math.floor(image.data.length * 3 / 4),
      base64Length: image.data.length
    })));
    const vlmResult = await analyzeProductPackagingWithVlm(inputImages);
    console.log('[MetrologyAI] Structured analysis validated');

    return NextResponse.json({
      success: true,
      data: vlmResult,
      extractedData: vlmResult.extractedData,
      imageQuality: vlmResult.imageQuality,
      sameProductWarning: vlmResult.sameProductWarning,
      savedImages: savedImagesInfo
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[MetrologyAI] Gemini analysis failed:', describeError(err));

    if (errorMsg.includes('CONFIG_ERROR')) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is not configured. Add it to the server environment.' },
        { status: 503 }
      );
    }

    if (/401|403|authentication|api key|unauthorized/i.test(errorMsg)) {
      return NextResponse.json(
        { success: false, error: 'Gemini authentication failed. Check the configured GEMINI_API_KEY.' },
        { status: 502 }
      );
    }

    if (/429|quota|rate limit|resource exhausted/i.test(errorMsg)) {
      return NextResponse.json(
        { success: false, error: 'Gemini is temporarily rate-limited. Please try again shortly.' },
        { status: 429 }
      );
    }

    if (/503|unavailable|high demand|service unavailable/i.test(errorMsg)) {
      return NextResponse.json(
        { success: false, error: 'Gemini is temporarily unavailable. Please try again shortly.' },
        { status: 503 }
      );
    }

    if (errorMsg.includes('TIMEOUT_ERROR')) {
      return NextResponse.json(
        { success: false, error: 'Gemini took too long to respond. Please try again.' },
        { status: 504 }
      );
    }

    if (errorMsg.includes('API_ERROR')) {
      return NextResponse.json(
        { success: false, error: 'Unable to interpret the structured Gemini analysis. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Gemini analysis request failed. Please try again.' },
      { status: 500 }
    );
  }
}
