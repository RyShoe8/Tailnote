import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/onboarding') {
    const token = getSessionCookie(request);
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const isPublicInvite =
    pathname.startsWith('/invite/') ||
    (pathname.startsWith('/api/invite/') && !pathname.endsWith('/accept'));

  const needsAuth =
    !isPublicInvite &&
    (pathname.startsWith('/admin') ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/api/dashboard') ||
      pathname.startsWith('/api/admin') ||
      pathname.startsWith('/api/stripe/checkout') ||
      pathname.startsWith('/api/stripe/cancel-subscription') ||
      pathname.startsWith('/api/stripe/change-plan') ||
      pathname.startsWith('/api/stripe/reactivate-subscription') ||
      pathname.startsWith('/api/onboarding/'));

  if (needsAuth) {
    const token = getSessionCookie(request);
    if (!token) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/onboarding',
    '/invite/:path*',
    '/api/invite/:path*',
    '/admin',
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/dashboard/:path*',
    '/api/admin/:path*',
    '/api/stripe/checkout',
    '/api/stripe/cancel-subscription',
    '/api/stripe/change-plan',
    '/api/stripe/reactivate-subscription',
    '/api/onboarding/:path*',
  ],
};
