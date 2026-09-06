import { NextResponse } from 'next/server';
import { getCurrentInspector } from '@/lib/auth';

export async function GET() {
  try {
    const inspector = await getCurrentInspector();
    if (!inspector) {
      return NextResponse.json({ authenticated: false, inspector: null }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, inspector });
  } catch (err: unknown) {
    console.error('Session verification error:', err);
    return NextResponse.json({ authenticated: false, inspector: null }, { status: 500 });
  }
}
