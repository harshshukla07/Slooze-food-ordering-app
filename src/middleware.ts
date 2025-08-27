import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; 

// A secret key for verifying JWTs. This MUST match the secret in your login route.
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'my-super-secret-key-that-is-at-least-32-characters-long'
);

export async function middleware(request: NextRequest) {
  // If the request is for the login route, let it pass without checks.
  if (request.nextUrl.pathname.startsWith('/api/auth/login')) {
    return NextResponse.next();
  }

  // 1. Get the token from the Authorization header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Authorization required' },
      { status: 401 }
    );
  }

  try {
    // 2. Verify the token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // 3. Attach the decoded payload to the request headers
    // This makes the user's info available to all subsequent API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-user-role', payload.role as string);
    requestHeaders.set('x-user-country', payload.country as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    console.error('JWT Verification Error:', err);
    return NextResponse.json(
      { success: false, message: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

// This config specifies which routes the middleware should run on.
export const config = {
  matcher: '/api/:path*',
};