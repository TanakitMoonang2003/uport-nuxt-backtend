import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, createCorsResponse } from './lib/cors';

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '';

  // Handle preflight requests (OPTIONS)
  if (request.method === 'OPTIONS') {
    return createCorsResponse(204, origin);
  }

  // Handle simple requests
  const response = NextResponse.next();
  return addCorsHeaders(response, origin);
}

export const config = {
  matcher: '/api/:path*',
};
