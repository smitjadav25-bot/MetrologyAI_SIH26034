import { NextRequest, NextResponse } from 'next/server';
import { getInspectionByCertificateId, getInspectionById } from '@/lib/storage';
import { generateComplianceCertificatePdf } from '@/lib/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inspection = getInspectionByCertificateId(id) || getInspectionById(id);

    if (!inspection) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Strictly enforce: if the inspection failed, has a notice, or score is not 100, redirect to Notice PDF
    if (inspection.complianceScore < 100 || inspection.finalStatus !== 'PASS' || !inspection.certificateId) {
      const noticeId = inspection.noticeId || inspection.inspectionId;
      return NextResponse.redirect(new URL(`/api/pdf/notice/${noticeId}`, req.url));
    }

    const baseUrl = req.nextUrl.origin;

    const pdfBytes = await generateComplianceCertificatePdf(inspection, baseUrl);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Compliance-Certificate-${inspection.certificateId || id}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (err) {
    console.error('Error generating certificate PDF:', err);
    return NextResponse.json({ error: 'Failed to generate certificate PDF' }, { status: 500 });
  }
}
