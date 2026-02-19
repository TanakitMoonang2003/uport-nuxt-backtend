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

// Set body size limit for avatar uploads (base64)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded: AuthTokenPayload;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as AuthTokenPayload;
    } catch (jwtError) {
      console.error('JWT verification failed in /api/user/profile:', jwtError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Find user by ID
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user profile',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded: AuthTokenPayload;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as AuthTokenPayload;
    } catch (jwtError) {
      console.error('JWT verification failed in PUT /api/user/profile:', jwtError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    console.log('Profile update - User ID:', decoded.userId);
    console.log('Profile update - body keys:', Object.keys(body));
    console.log('Profile update - avatarBase64 present:', body.avatarBase64 !== undefined, 'length:', body.avatarBase64?.length ?? 0);

    // Check if User model exists
    if (!User) {
      console.error('User model is not defined!');
      throw new Error('User model is not defined');
    }

    // Validate that user exists before updating
    const existingUser = await User.findById(decoded.userId);
    if (!existingUser) {
      console.error('User not found for ID:', decoded.userId);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Filter out any invalid fields and only update allowed fields
    const allowedFields = [
      'username', 'firstName', 'lastName', 'phone', 'bio', 'skills', 
      'portfolioFiles', 'yearOfStudy', 'department', 'avatarUrl', 'uploadedAt'
    ];
    
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Map avatarBase64 → avatarUrl (frontend may send either field name)
    if (body.avatarBase64 !== undefined) {
      updateData.avatarUrl = body.avatarBase64;
    }

    console.log('updateData keys:', Object.keys(updateData));
    console.log('updateData.avatarUrl present:', !!updateData.avatarUrl, 'length:', updateData.avatarUrl?.length ?? 0);

    // Update user profile
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Saved user.avatarUrl length:', user.avatarUrl?.length ?? 0);

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }));
      
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          validationErrors,
          message: 'Please check your input and try again'
        },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate entry',
          message: `${field} already exists`
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user profile',
        message: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
