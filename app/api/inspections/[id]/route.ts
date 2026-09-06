import { NextRequest, NextResponse } from 'next/server';
import { getInspectionById, saveInspection, generateNextId } from '@/lib/storage';
import { evaluateLegalMetrologyCompliance } from '@/lib/compliance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inspection = getInspectionById(id);
    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }
    return NextResponse.json({ inspection });
  } catch (err) {
    console.error('Error fetching inspection by ID:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = getInspectionById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    const body = await req.json();
    const { reviewedData, inspectorRemarks } = body;

    if (!reviewedData) {
      return NextResponse.json({ error: 'Missing reviewed data' }, { status: 400 });
    }

    // Re-evaluate compliance checks deterministically on updated data (Section 49)
    const compliance = evaluateLegalMetrologyCompliance(reviewedData);

    // If status changed or regenerated, issue updated document IDs and mark old superseded
    let certificateId = existing.certificateId;
    let noticeId = existing.noticeId;

    if (compliance.finalStatus === 'PASS' && !certificateId) {
      certificateId = generateNextId('CERT');
    } else if (compliance.finalStatus === 'FAIL' && !noticeId) {
      noticeId = generateNextId('NOTICE');
    }

    const updated = {
      ...existing,
      reviewedData,
      inspectorRemarks: inspectorRemarks !== undefined ? inspectorRemarks : existing.inspectorRemarks,
      ruleResults: compliance.ruleResults,
      complianceScore: compliance.complianceScore,
      finalStatus: compliance.finalStatus,
      recommendedAction: compliance.recommendedAction,
      certificateId,
      noticeId,
      documentStatus: 'Active' as const,
      updatedAt: new Date().toISOString()
    };

    const saved = saveInspection(updated);
    return NextResponse.json({ success: true, inspection: saved });
  } catch (err) {
    console.error('Error updating inspection:', err);
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 });
  }
}
