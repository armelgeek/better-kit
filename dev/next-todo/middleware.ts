import { NextResponse, type NextRequest } from 'next/server';

import { betterFetch } from '@better-fetch/fetch';
import { auth } from './lib/auth';


type Session = typeof auth.$Infer.Session;

const UNPROTECTED_ROUTES = ['/auth'];
const PROTECTED_ROUTES = ['/todo'];

export default async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { data: session } = await betterFetch<Session>('/api/auth/get-session', {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  });

  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    return NextResponse.next();
  }

  if (session && UNPROTECTED_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/todo', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
