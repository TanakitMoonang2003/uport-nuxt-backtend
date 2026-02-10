import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Handle CORS preflight requests
export async function OPTIONS(_request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST /api/admin/confirm-teacher - Confirm or reject teacher
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { teacherId, action } = body;
    
    console.log('=== CONFIRMING TEACHER ===');
    console.log('Teacher ID:', teacherId);
    console.log('Action:', action);
    
    if (!teacherId || !action) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID and action are required' },
        { status: 400 }
      );
    }
    
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be "accept" or "reject"' },
        { status: 400 }
      );
    }
    
    // Find the teacher
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }
    
    if (teacher.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'User is not a teacher' },
        { status: 400 }
      );
    }
    
    // Update teacher status
    if (action === 'accept') {
      teacher.isTeacherConfirmed = true;
      teacher.isActive = true;
    } else {
      // For reject, you might want to delete the user or mark as rejected
      teacher.isActive = false;
    }
    
    await teacher.save();
    
    console.log('Teacher updated successfully:', {
      id: teacher._id,
      email: teacher.email,
      isTeacherConfirmed: teacher.isTeacherConfirmed,
      isActive: teacher.isActive
    });
    
    return NextResponse.json({
      success: true,
      message: `Teacher ${action === 'accept' ? 'confirmed' : 'rejected'} successfully`,
      data: {
        id: teacher._id,
        email: teacher.email,
        isTeacherConfirmed: teacher.isTeacherConfirmed,
        isActive: teacher.isActive
      }
    });
  } catch (error) {
    console.error('Error confirming teacher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to confirm teacher' },
      { status: 500 }
    );
  }
}









