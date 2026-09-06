import { NextRequest, NextResponse } from 'next/server';
import { getInspections, saveInspection, generateNextId } from '@/lib/storage';
import { evaluateLegalMetrologyCompliance } from '@/lib/compliance';
import { Inspection } from '@/types/inspection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = getInspections();
    return NextResponse.json({ inspections: list });
  } catch (err) {
    console.error('Failed to get inspections:', err);
    return NextResponse.json({ error: 'Failed to retrieve inspections' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      reviewedData,
      extractedData,
      images,
      inspector,
      inspectorRemarks
    } = body;

    if (!reviewedData) {
      return NextResponse.json({ error: 'Missing reviewed inspection data' }, { status: 400 });
    }

    // Always run compliance check server-side on reviewedData (Section 60: never trust client-side compliance score!)
    const compliance = evaluateLegalMetrologyCompliance(reviewedData);

    const inspectionId = generateNextId('INS');
    let certificateId: string | undefined = undefined;
    let noticeId: string | undefined = undefined;

    if (compliance.finalStatus === 'PASS') {
      certificateId = generateNextId('CERT');
    } else {
      noticeId = generateNextId('NOTICE');
    }

    const newInspection: Inspection = {
      inspectionId,
      createdAt: new Date().toISOString(),
      inspector: inspector || {
        id: 'INS-OFFICER-402',
        name: 'Inspector S. K. Verma',
        designation: 'Legal Metrology Inspector',
        jurisdiction: 'Zone-1 Enforcement Division'
      },
      images: images || [],
      extractedData: extractedData || reviewedData,
      reviewedData: reviewedData,
      ruleResults: compliance.ruleResults,
      complianceScore: compliance.complianceScore,
      finalStatus: compliance.finalStatus,
      inspectorRemarks: inspectorRemarks || '',
      recommendedAction: compliance.recommendedAction,
      certificateId,
      noticeId,
      documentStatus: 'Active'
    };

    const saved = saveInspection(newInspection);
    return NextResponse.json({ success: true, inspection: saved });
  } catch (err) {
    console.error('Failed to save inspection:', err);
    return NextResponse.json({ error: 'Failed to save inspection assessment' }, { status: 500 });
  }
}
