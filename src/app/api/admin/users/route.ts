import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

interface AuthTokenPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'company' | 'teacher';
  username?: string;
}

// Handle CORS preflight requests
export async function OPTIONS(_request: NextRequest) {
  return new Response(null, {
    status: 200,
     });
}

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { 
          status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: AuthTokenPayload;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as AuthTokenPayload;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { 
          status: 401 }
      );
    }
    
    // Check if user is admin
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only Admin can access user management' },
        { 
          status: 403 }
      );
    }

    // Get all users (exclude password)
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: users
    }, {
      
    });

  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { 
        status: 500 }
    );
  }
}
