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
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
     });
}

// GET /api/teacher-confirmations - Get pending teacher registrations for companies
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    console.log('🔍 Teacher Confirmations - Auth Header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Teacher Confirmations - No valid auth header');
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('🔍 Teacher Confirmations - Extracted token:', token);
    console.log('🔍 Teacher Confirmations - Token length:', token.length);
    console.log('🔍 Teacher Confirmations - Token parts:', token.split('.').length);
    
    let decoded: AuthTokenPayload;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as AuthTokenPayload;
      console.log('✅ Teacher Confirmations - Token verified successfully');
    } catch (jwtError) {
      console.error('❌ Teacher Confirmations - JWT verification failed:', jwtError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Check if user is admin or teacher
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) {
      return NextResponse.json(
        { success: false, error: 'Only Admin or Teacher can access teacher confirmations' },
        { status: 403 }
      );
    }

    // Get pending teacher registrations
    const pendingTeachers = await User.find({
      role: 'teacher',
      isTeacherConfirmed: false
    }).select('-password');

    return NextResponse.json({
      success: true,
      data: pendingTeachers
    }, {
      status: 200 });

  } catch (error) {
    console.error('Error fetching teacher confirmations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teacher confirmations' },
      { 
        status: 500 }
    );
  }
}

// POST /api/teacher-confirmations - Confirm or reject teacher registration
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as AuthTokenPayload;
    
    // Check if user is admin or teacher
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) {
      return NextResponse.json(
        { success: false, error: 'Only Admin or Teacher can confirm teacher registrations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teacherId, action } = body; // action: 'accept' or 'reject'

    if (!teacherId || !action) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be either "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Find the teacher
    const teacher = await User.findOne({
      _id: teacherId,
      role: 'teacher',
      isTeacherConfirmed: false
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found or already processed' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // Accept the teacher
      teacher.isTeacherConfirmed = true;
      teacher.confirmedBy = currentUser._id.toString();
      teacher.confirmedAt = new Date();
      await teacher.save();
    } else {
      // Reject the teacher - delete the user
      await User.findByIdAndDelete(teacherId);
    }

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? 'Teacher registration confirmed' : 'Teacher registration rejected'
    }, {
      status: 200 });

  } catch (error) {
    console.error('Error processing teacher confirmation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process teacher confirmation' },
      { 
        status: 500 }
    );
  }
}
