import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

interface AuthTokenPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'company' | 'teacher';
  username?: string;
}

// POST /api/user/profile/portfolio - Upload portfolio file
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
      console.error('JWT verification failed in /api/user/profile/portfolio:', jwtError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PNG, JPEG, JPG, WebP, and PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = file.type === 'application/pdf' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for PDF, 10MB for images
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File size too large. Maximum size is ${file.type === 'application/pdf' ? '5MB' : '10MB'}` },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'portfolio');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${decoded.userId}_${timestamp}.${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    // Save file to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create file URL
    const fileUrl = `/uploads/portfolio/${uniqueFilename}`;

    // Update user's portfolio files array
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const fileData = {
      id: new Date().getTime().toString(),
      name: file.name,
      type: fileType === 'application/pdf' ? 'pdf' : 'image',
      size: file.size,
      url: fileUrl,
      uploadedAt: new Date()
    };

    if (!user.portfolioFiles) {
      user.portfolioFiles = [];
    }
    user.portfolioFiles.push(fileData);

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        fileData
      }
    });
  } catch (error: any) {
    console.error('Error uploading portfolio file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        message: error.message
      },
      { status: 500 }
    );
  }
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

    const url = new URL(request.url);
    const fileId = url.pathname.split('/').pop();

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
