import { NextResponse } from 'next/server';
import { getInspectors, toSafeInspector, getCurrentInspector, deleteInspector } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const caller = await getCurrentInspector();
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin privilege required.' }, { status: 403 });
    }

    const all = getInspectors();
    const safeList = all.map(toSafeInspector);
    return NextResponse.json({ inspectors: safeList });
  } catch (err) {
    console.error('Error listing inspectors:', err);
    return NextResponse.json({ error: 'Failed to retrieve inspectors' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const caller = await getCurrentInspector();
    if (!caller || caller.role !== 'ADMIN') {
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
      return NextResponse.json({ error: 'Missing inspector id parameter.' }, { status: 400 });
    }

    const cleanId = decodeURIComponent(id).trim();
    const success = deleteInspector(cleanId) || deleteInspector(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Inspector not found or root administrator account cannot be deleted.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Inspector deleted successfully.' });
  } catch (err) {
    console.error('Error deleting inspector via collection endpoint:', err);
    return NextResponse.json({ error: 'Failed to delete inspector' }, { status: 500 });
  }
}
