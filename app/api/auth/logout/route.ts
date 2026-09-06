import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (err: unknown) {
    console.error('Logout error:', err);
    return NextResponse.json({ success: false, error: 'Failed to logout.' }, { status: 500 });
  }
}
