import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { addCorsHeaders, createCorsResponse } from '@/lib/cors';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined;
  return createCorsResponse(200, origin);
}

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || undefined;
    await connectDB();
    
    const body = await request.json();
    let { email, password } = body;

    // Normalize email: trim whitespace and convert to lowercase
    // This matches the User schema which stores emails in lowercase
    email = email ? email.trim().toLowerCase() : email;
    password = password ? password.trim() : password;

    // Validation
    if (!email || !password) {
      const response = NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // Find user by email (include password field)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      const response = NextResponse.json(
        { success: false, error: 'Email or Password something Wrong.' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    // Check if user is active
    if (!user.isActive) {
      const response = NextResponse.json(
        { success: false, error: 'Email or Password something Wrong.' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    // Check if company is approved (for company users)
    if (user.role === 'company' && !user.isCompanyApproved) {
      const response = NextResponse.json(
        { success: false, error: 'Wait for the teacher or administrator to click Agree.' },
        { status: 403 }
      );
      return addCorsHeaders(response, origin);
    }

    // Check if teacher is confirmed (for teacher users only, not admin)
    if (user.role === 'teacher' && !user.isTeacherConfirmed) {
      const response = NextResponse.json(
        { success: false, error: 'Wait for the teacher or administrator to click Agree.' },
        { status: 403 }
      );
      return addCorsHeaders(response, origin);
    }

    // Verify password
    if (!user.password) {
      console.error('❌ Password field is missing from user object!');
      const response = NextResponse.json(
        { success: false, error: 'Email or Password something Wrong.' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      const response = NextResponse.json(
        { success: false, error: 'Email or Password something Wrong.' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      token
    };

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: userResponse,
      },
      {
        status: 200,
      }
    );
    return addCorsHeaders(response, origin);

  } catch (error) {
    console.error('Login error:', error);
    const origin = request.headers.get('origin') || undefined;
    const response = NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
