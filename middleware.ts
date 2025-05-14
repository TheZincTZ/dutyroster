import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of protected routes that require authentication
const PROTECTED_ROUTES = ['/adminupload', '/api/upload'];

export function middleware(request: NextRequest) {
  try {
    // Add security headers to all responses
    const response = NextResponse.next();

    // Security headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;");

    // Check if the route is protected
    const isProtectedRoute = PROTECTED_ROUTES.some(route => request.nextUrl.pathname.startsWith(route));
    
    if (isProtectedRoute) {
      // For API routes, check for X-Requested-With header
      if (request.nextUrl.pathname.startsWith('/api/')) {
        const requestedWith = request.headers.get('x-requested-with');
        if (requestedWith !== 'XMLHttpRequest') {
          return new NextResponse(
            JSON.stringify({ error: 'Invalid request' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // For admin routes, check for authentication
      if (request.nextUrl.pathname.startsWith('/adminupload')) {
        const isAuthenticated = request.cookies.has('admin_authenticated');
        if (!isAuthenticated) {
          return NextResponse.redirect(new URL('/adminupload', request.url));
        }
      }
    }

    return response;
  } catch (error) {
    // If middleware fails, return a simple error response
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 