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
      pathname.startsWith('/api/stripe/portal') ||
      pathname.startsWith('/api/onboarding/') ||
      pathname.startsWith('/api/integrations/gmail'));

  // Gmail OAuth callback must accept unauthenticated requests: Google redirects here with ?code=&state=;
  // the route verifies HMAC state and binds tokens to userId inside state (session cookie may be absent in edge cases).
  const allowWithoutSession = pathname === '/api/integrations/gmail/callback';

  if (needsAuth && !allowWithoutSession) {
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
    '/api/stripe/portal',
    '/api/onboarding/:path*',
    '/api/integrations/gmail/:path*',
  ],
};
