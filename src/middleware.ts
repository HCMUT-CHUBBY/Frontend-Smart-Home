import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/manage-devices', '/settings'];

const authPaths = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;

  if (protectedPaths.some(path => pathname.startsWith(path)) && !sessionToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (authPaths.some(path => pathname === path) && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};