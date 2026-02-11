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

// POST /api/portfolio/approve - Approve or reject a portfolio
export async function POST(request: NextRequest) {
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
        { success: false, error: 'Only admin or teacher can approve portfolios' },
        { 
          status: 403 }
      );
    }
    
    const body = await request.json();
    const { portfolioId, action } = body; // action: 'approve' or 'reject'
    
    if (!portfolioId || !action) {
      return NextResponse.json(
        { success: false, error: 'Portfolio ID and action are required' },
        { 
          status: 400 }
      );
    }
    
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, error: 'Action must be "approve" or "reject"' },
        { 
          status: 400 }
      );
    }
    
    // Find portfolio by ID (numeric id field)
    const portfolio = await Portfolio.findOne({ id: portfolioId });
    
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { 
          status: 404 }
      );
    }
    
    // Update portfolio status
    portfolio.status = action === 'approve' ? 'approved' : 'rejected';
    portfolio.approvedBy = decoded.email || decoded.username || decoded.userId;
    portfolio.approvedAt = new Date();
    
    await portfolio.save();
    
    console.log(`✅ Portfolio ${portfolioId} ${action}d by ${decoded.email || decoded.username}`);
    
    return NextResponse.json({
      success: true,
      message: `Portfolio ${action}d successfully`,
      data: portfolio
    }, {
      
    });
    
  } catch (error: unknown) {
    console.error('Error approving/rejecting portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process approval' },
      { 
        status: 500 }
    );
  }
}
