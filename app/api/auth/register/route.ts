import { NextRequest, NextResponse } from 'next/server';
import { registerInspector } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, officerId, designation, jurisdiction, email, password } = body;

    const result = await registerInspector({
      name,
      officerId,
      designation,
      jurisdiction,
      email,
      password
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to register inspector.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      inspector: result.inspector
    });
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
