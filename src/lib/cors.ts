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
    'http://localhost:3003',
    'http://127.0.0.1:3003',
    // Vercel deployments
    'https://uport-nuxt-frontend-git-main-tanakitmoonang2003s-projects.vercel.app',
    'https://uport-nuxt-frontend-tanakitmoonang2003s-projects.vercel.app',
    'https://uport-nuxt-frontend.vercel.app',
    ...envOrigins,
    'null' // For file:// protocol testing
  ];


  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export function createCorsResponse(status: number = 200, origin?: string) {
  // Get allowed origins from environment or use defaults
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3003',
    // Vercel deployments
    'https://uport-nuxt-frontend-git-main-tanakitmoonang2003s-projects.vercel.app',
    'https://uport-nuxt-frontend-tanakitmoonang2003s-projects.vercel.app',
    'https://uport-nuxt-frontend.vercel.app',
    ...envOrigins,
    'null' // For file:// protocol testing
  ];
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : '*';

  return new Response(null, {
    status,
    headers: {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
