import { NextRequest, NextResponse } from 'next/server';
import { getCurrentInspector, deleteInspector } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await getCurrentInspector();
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin privilege required.' }, { status: 403 });
    }

    const { id } = await params;
    const cleanId = decodeURIComponent(id || '').trim();
    const success = deleteInspector(cleanId) || deleteInspector(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Inspector not found or root administrator account cannot be deleted.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: `Inspector deleted successfully.` });
  } catch (err) {
    console.error('Error deleting inspector:', err);
    return NextResponse.json({ error: 'Failed to delete inspector' }, { status: 500 });
  }
}
