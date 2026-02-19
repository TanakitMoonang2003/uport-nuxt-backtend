import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import path from 'path';

interface AuthTokenPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'company' | 'teacher';
  username?: string;
}

// DELETE /api/user/profile/portfolio/[fileId] - Remove portfolio file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
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
      console.error('JWT verification failed in DELETE /api/user/profile/portfolio:', jwtError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Find user and remove file from portfolioFiles array
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.portfolioFiles || user.portfolioFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No portfolio files found' },
        { status: 404 }
      );
    }

    // Find and remove the file
    const fileIndex = user.portfolioFiles.findIndex((file: any) => file.id === fileId);
    if (fileIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    const removedFile = user.portfolioFiles[fileIndex];
    user.portfolioFiles.splice(fileIndex, 1);

    await user.save();

    // Optionally delete the file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', removedFile.url);
      const fs = await import('fs/promises');
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
      console.log('File not found in filesystem:', removedFile.url);
    }

    return NextResponse.json({
      success: true,
      message: 'File removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing portfolio file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove file',
        message: error.message
      },
      { status: 500 }
    );
  }
}
