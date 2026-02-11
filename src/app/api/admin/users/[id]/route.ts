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

// Helper function to verify admin
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization token required', status: 401 };
  }

  const token = authHeader.substring(7);
  let decoded: AuthTokenPayload;
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as AuthTokenPayload;
  } catch (error) {
    return { error: 'Invalid or expired token', status: 401 };
  }
  
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser || currentUser.role !== 'admin') {
    return { error: 'Only Admin can perform this action', status: 403 };
  }

  return { user: currentUser, decoded };
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { 
          status: authResult.status }
      );
    }

    const { id: userId } = await context.params;
    const body = await request.json();
    const { username, email, role } = body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { 
          status: 404 }
      );
    }

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email.toLowerCase();
    if (role && ['admin', 'teacher', 'user', 'company'].includes(role)) {
      user.role = role;
    }

    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(userId).select('-password');

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    }, {
      
    });

  } catch (error: unknown) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { 
        status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id]/status - Toggle user status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { 
          status: authResult.status }
      );
    }

    const { id: userId } = await context.params;
    const body = await request.json();
    const { isActive } = body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { 
          status: 404 }
      );
    }

    // Prevent deactivating yourself
    if (authResult.user._id.toString() === userId && isActive === false) {
      return NextResponse.json(
        { success: false, error: 'You cannot deactivate yourself' },
        { 
          status: 400 }
      );
    }

    // Update status
    user.isActive = isActive !== undefined ? isActive : !user.isActive;
    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(userId).select('-password');

    return NextResponse.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    }, {
      
    });

  } catch (error: unknown) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user status' },
      { 
        status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { 
          status: authResult.status }
      );
    }

    const { id: userId } = await context.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { 
          status: 404 }
      );
    }

    // Prevent deleting yourself
    if (authResult.user._id.toString() === userId) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete yourself' },
        { 
          status: 400 }
      );
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete admin users' },
        { 
          status: 400 }
      );
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    }, {
      
    });

  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { 
        status: 500 }
    );
  }
}
