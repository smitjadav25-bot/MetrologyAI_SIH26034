import { NextRequest, NextResponse } from 'next/server';
import { analyzeProductPackagingWithVlm, InputImagePart } from '@/lib/gemini';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    ensureUploadsDir();

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSizeBytes = 15 * 1024 * 1024; // 15MB

    const inputImages: InputImagePart[] = [];
    const savedImagesInfo: Array<{ id: string; url: string; originalName: string; viewType?: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate MIME type
      if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          { error: `File "${file.name}" is not a supported format. Please upload JPEG, PNG, or WebP images.` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > maxSizeBytes) {
        return NextResponse.json(
          { error: `File "${file.name}" is too large (max 15MB).` },
          { status: 400 }
        );
      }

      // Basic image sanity check (not OCR!): file size must be at least 4KB to contain readable text
      if (file.size < 4096) {
        return NextResponse.json(
          { error: 'Image quality is too low to reliably inspect the label. Please provide a higher resolution photo.' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const imageId = `img_${Date.now()}_${i + 1}`;
      const filename = `${imageId}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);

      fs.writeFileSync(filePath, buffer);

      const base64Data = buffer.toString('base64');
      const sourceLabel = `image-${i + 1}`;

      inputImages.push({
        data: base64Data,
        mimeType: file.type || 'image/jpeg',
        sourceLabel
      });

      savedImagesInfo.push({
        id: sourceLabel,
        url: `/uploads/${filename}`,
        originalName: file.name
      });
    }

    // Pass real product images to Gemini VLM
    const vlmResult = await analyzeProductPackagingWithVlm(inputImages);

    return NextResponse.json({
      success: true,
      extractedData: vlmResult.extractedData,
      imageQuality: vlmResult.imageQuality,
      sameProductWarning: vlmResult.sameProductWarning,
      savedImages: savedImagesInfo
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('API /api/analyze error:', errorMsg);

    if (errorMsg.includes('CONFIG_ERROR')) {
      return NextResponse.json(
        { error: 'AI analysis is currently unavailable. Please contact the system administrator.' },
        { status: 503 }
      );
    }

    if (errorMsg.includes('API_ERROR') || errorMsg.includes('interpretation')) {
      return NextResponse.json(
        { error: 'The label could not be read reliably. Please upload a clearer image.' },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: 'Unable to analyze the product image. Please try again.' },
      { status: 500 }
    );
  }
}
