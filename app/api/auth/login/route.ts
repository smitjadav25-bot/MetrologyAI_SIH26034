import { NextRequest, NextResponse } from 'next/server';
import {
  findInspectorByEmail,
  findInspectorByOfficerId,
  findInspectorByName,
  verifyPassword,
  toSafeInspector,
  createSessionToken,
  setAuthCookie
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide your Username, Email, or Officer ID and password.' },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();
    // Allow login by name (e.g. 'smit'), email, or officer ID
    const user =
      findInspectorByName(trimmedIdentifier) ||
      findInspectorByEmail(trimmedIdentifier) ||
      findInspectorByOfficerId(trimmedIdentifier);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Inspector account not found.' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Incorrect password.' },
        { status: 401 }
      );
    }

    const safeInspector = toSafeInspector(user);
    const token = await createSessionToken(safeInspector);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      inspector: safeInspector
    });
  } catch (err: unknown) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error during login.' },
      { status: 500 }
    );
  }
}
