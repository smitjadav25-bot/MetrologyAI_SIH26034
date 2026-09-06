import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'metrology_inspector_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'metrology-ai-secret-key-pcr-2011-statutory-enforcement-jwt-session-token';
const encodedSecret = new TextEncoder().encode(SESSION_SECRET);

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ['HS256']
    });
    return !!payload?.inspectorId;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname === '/inspection' ||
    pathname.startsWith('/inspection/') ||
    pathname === '/history' ||
    pathname.startsWith('/history/');

  const isAuthRoute = pathname === '/login' || pathname === '/register';

  const userIsAuthed = await isAuthenticated(request);

  if (isProtectedRoute && !userIsAuthed) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && userIsAuthed) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, pdf files, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
