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

// POST /api/admin/update-user-role - Update user role to admin
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, newRole = 'admin' } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Found user:', {
      id: user._id,
      email: user.email,
      username: user.username,
      currentRole: user.role
    });

    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { role: newRole },
      { new: true }
    );

    console.log('User updated:', {
      id: updatedUser._id,
      email: updatedUser.email,
      username: updatedUser.username,
      newRole: updatedUser.role
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${newRole}`,
      data: {
        id: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user role' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}
