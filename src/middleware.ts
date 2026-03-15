import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

// ============================================================
// Next.js Middleware — protects (authenticated) route group.
//
// - Checks for a valid session cookie on authenticated routes
// - Redirects unauthenticated users to /dang-nhap
// - Passes userId and userType via request headers for
//   server components to read
// - Skips public routes, API routes, and static assets
// ============================================================

/** Paths that require authentication */
const AUTHENTICATED_PATHS = [
  '/ho-so',
  '/lich-ranh',
  '/don-ung-tuyen',
  '/dashboard',
];

function isAuthenticatedRoute(pathname: string): boolean {
  return AUTHENTICATED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isStaticOrInternal(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files (favicon.ico, images, etc.)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, internal Next.js routes, and API routes
  if (isStaticOrInternal(pathname)) {
    return NextResponse.next();
  }

  // Only enforce auth on authenticated routes
  if (!isAuthenticatedRoute(pathname)) {
    return NextResponse.next();
  }

  const session = getSessionFromRequest(request);

  if (!session) {
    const loginUrl = new URL('/dang-nhap', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Pass session data to server components via request headers
  const response = NextResponse.next();
  response.headers.set('x-user-id', session.userId);
  response.headers.set('x-user-type', session.userType);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
