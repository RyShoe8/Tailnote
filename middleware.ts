import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { normalizeBackslashPathname } from '@/lib/security/normalizePathname';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const normalizedPath = normalizeBackslashPathname(pathname);
  if (normalizedPath !== null) {
    const url = request.nextUrl.clone();
    url.pathname = normalizedPath;
    return NextResponse.redirect(url, 301);
  }

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
    '/((?!_next/static|_next/image|.*\\..*).*)',
  ],
};
