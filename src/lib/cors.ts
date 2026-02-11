import { NextResponse } from 'next/server';

export function addCorsHeaders(response: NextResponse, origin?: string) {
  // Get allowed origins from environment or use defaults
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'https://uport-nuxt-frontend-git-main-tanakitmoonang2003s-projects.vercel.app',
    'https://uport-nuxt-frontend-tanakitmoonang2003s-projects.vercel.app',
    'https://uport-nuxt-frontend.vercel.app',
    ...envOrigins
  ];

  // If the request origin is in our allowed list, use it.
  // Otherwise, use null or don't set it (CORS will fail if we don't return an allowed origin)
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : '';

  if (allowOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

export function createCorsResponse(status: number = 204, origin?: string) {
  // Get allowed origins from environment or use defaults
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'https://uport-nuxt-frontend-git-main-tanakitmoonang2003s-projects.vercel.app',
    'https://uport-nuxt-frontend-tanakitmoonang2003s-projects.vercel.app',
    'https://uport-nuxt-frontend.vercel.app',
    ...envOrigins
  ];

  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : '';

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };

  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
  }

  return new NextResponse(null, {
    status,
    headers,
  });
}
