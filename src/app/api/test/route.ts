import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders } from '@/lib/cors';

export async function GET(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
  
  const origin = request.headers.get('origin');
  return addCorsHeaders(response, origin || undefined);
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin || undefined);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = NextResponse.json({
      success: true,
      message: 'POST request received',
      data: body,
      timestamp: new Date().toISOString()
    });
    
    const origin = request.headers.get('origin');
    return addCorsHeaders(response, origin || undefined);
  } catch {
    const response = NextResponse.json({
      success: false,
      error: 'Invalid JSON'
    }, { status: 400 });
    
    const origin = request.headers.get('origin');
    return addCorsHeaders(response, origin || undefined);
  }
}
