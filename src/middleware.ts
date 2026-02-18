// autoloan-nextjs-metafullstack/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/account-locked', '/confirm-email'];
const OFFICER_PATHS = ['/officer'];
const UNDERWRITER_PATHS = ['/underwriter'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths, API routes, and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  const role = req.cookies.get('user_role')?.value;

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (OFFICER_PATHS.some((p) => pathname.startsWith(p)) && role !== 'loan_officer') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (UNDERWRITER_PATHS.some((p) => pathname.startsWith(p)) && role !== 'underwriter') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
