import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.user?.role === 'AHASS' && pathname !== '/input-ahass') {
    return NextResponse.redirect(new URL('/input-ahass', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)'],
};
