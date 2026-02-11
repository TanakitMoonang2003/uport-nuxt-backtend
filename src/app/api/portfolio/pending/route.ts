import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Portfolio from '@/models/Portfolio';
import jwt from 'jsonwebtoken';

interface AuthTokenPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'company' | 'teacher';
  username?: string;
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
     });
}

// GET /api/portfolio/pending - Get all pending portfolios (for admin/teacher)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { 
          status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    let decoded: AuthTokenPayload;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as AuthTokenPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { 
          status: 401 }
      );
    }
    
    // Check if user is admin or teacher
    if (decoded.role !== 'admin' && decoded.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Only admin or teacher can view pending portfolios' },
        { 
          status: 403 }
      );
    }
    
    // Get pending portfolios
    const pendingPortfolios = await Portfolio.find({ status: 'pending' })
      .sort({ createdAt: -1 }); // Newest first
    
    return NextResponse.json({
      success: true,
      data: pendingPortfolios,
      count: pendingPortfolios.length
    }, {
      
    });
    
  } catch (error: unknown) {
    console.error('Error fetching pending portfolios:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending portfolios' },
      { 
        status: 500 }
    );
  }
}
