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

// POST /api/user/profile/avatar - Upload avatar
export async function POST(request: NextRequest) {
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
      console.error('JWT verification failed in /api/user/profile/avatar:', jwtError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PNG, JPEG, JPG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 1MB)
    if (file.size > 1000000) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 1MB' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const avatarUrl = `data:${file.type};base64,${base64}`;

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { avatarUrl },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }


    return NextResponse.json({
      success: true,
      avatarUrl: user.avatarUrl,
      data: user
    });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload avatar',
        message: error.message
      },
      { status: 500 }
    );
  }
}
