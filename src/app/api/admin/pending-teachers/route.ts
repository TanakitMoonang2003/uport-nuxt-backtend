import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET /api/admin/pending-teachers - Get all pending teacher requests
export async function GET() {
  try {
    await connectDB();
    
    console.log('=== FETCHING PENDING TEACHERS ===');
    
    // Find all teachers that are not confirmed
    const pendingTeachers = await User.find({
      role: 'teacher',
      isTeacherConfirmed: { $ne: true }
    }).select('-password');
    
    console.log('Found pending teachers:', pendingTeachers.length);
    console.log('Pending teachers:', pendingTeachers);
    
    return NextResponse.json({
      success: true,
      data: pendingTeachers,
      count: pendingTeachers.length
    });
  } catch (error) {
    console.error('Error fetching pending teachers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending teachers' },
      { status: 500 }
    );
  }
}









