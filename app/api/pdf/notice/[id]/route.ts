import { NextRequest, NextResponse } from 'next/server';
import { getInspectionByNoticeId, getInspectionById } from '@/lib/storage';
import { generateNonComplianceNoticePdf } from '@/lib/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inspection = getInspectionByNoticeId(id) || getInspectionById(id);

    if (!inspection) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const pdfBytes = await generateNonComplianceNoticePdf(inspection, baseUrl);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Non-Compliance-Notice-${inspection.noticeId || id}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (err) {
    console.error('Error generating notice PDF:', err);
    return NextResponse.json({ error: 'Failed to generate notice PDF' }, { status: 500 });
  }
}
