import { NextRequest, NextResponse } from 'next/server';
import { getInspections, saveInspection, generateNextId, deleteInspection } from '@/lib/storage';
import { evaluateLegalMetrologyCompliance } from '@/lib/compliance';
import { getCurrentInspector } from '@/lib/auth';
import { Inspection } from '@/types/inspection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const inspector = await getCurrentInspector();
    if (!inspector) {
      return NextResponse.json({ error: 'Unauthorized. Inspector session required.' }, { status: 401 });
    }

    const list = getInspections();

    // If ADMIN, return all inspections across the entire platform
    if (inspector.role === 'ADMIN') {
      return NextResponse.json({ inspections: list });
    }

    // If INSPECTOR, isolate to their own inspections only
    const filtered = list.filter(i => {
      const insp = i.inspector;
      if (!insp) return false;
      return (
        insp.id === inspector.officerId ||
        insp.id === inspector.id ||
        (insp.name && insp.name.toLowerCase() === inspector.name.toLowerCase())
      );
    });

    return NextResponse.json({ inspections: filtered });
  } catch (err) {
    console.error('Failed to get inspections:', err);
    return NextResponse.json({ error: 'Failed to retrieve inspections' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentInspector = await getCurrentInspector();
    if (!currentInspector) {
      return NextResponse.json({ error: 'Unauthorized. Inspector session required.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      reviewedData,
      extractedData,
      images,
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

    // Strict statutory rule: ONLY 100% score with zero violations can receive a Certificate
    if (compliance.complianceScore === 100 && compliance.finalStatus === 'PASS') {
      certificateId = generateNextId('CERT');
    } else {
      noticeId = generateNextId('NOTICE');
    }

    const newInspection: Inspection = {
      inspectionId,
      createdAt: new Date().toISOString(),
      inspector: {
        id: currentInspector.officerId || currentInspector.id,
        name: currentInspector.name,
        designation: currentInspector.designation,
        jurisdiction: currentInspector.jurisdiction
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

export async function DELETE(req: NextRequest) {
  try {
    const currentInspector = await getCurrentInspector();
    if (!currentInspector || currentInspector.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin privilege required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing inspection id parameter.' }, { status: 400 });
    }

    const cleanId = decodeURIComponent(id).trim();
    const deleted = deleteInspection(cleanId) || deleteInspection(id);
    if (!deleted) {
      return NextResponse.json({ error: `Inspection ${cleanId} not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Inspection ${cleanId} deleted successfully.` });
  } catch (err) {
    console.error('Failed to delete inspection via collection endpoint:', err);
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 });
  }
}
