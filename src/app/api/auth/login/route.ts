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
    await connectDB();

    const body = await request.json();
    let { email, password } = body;

    // Normalize email: trim whitespace and convert to lowercase
    email = email ? email.trim().toLowerCase() : email;
    password = password ? password.trim() : password;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email (include password field)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password (ERR_USER_NOT_FOUND)' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is disabled. (ERR_USER_INACTIVE)' },
        { status: 401 }
      );
    }

    // Check if company is approved (for company users)
    if (user.role === 'company' && !user.isCompanyApproved) {
      return NextResponse.json(
        { success: false, error: 'Wait for the teacher or administrator to click Agree.' },
        { status: 403 }
      );
    }

    // Check if teacher is confirmed (for teacher users only, not admin)
    if (user.role === 'teacher' && !user.isTeacherConfirmed) {
      return NextResponse.json(
        { success: false, error: 'Wait for the teacher or administrator to click Agree.' },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password) {
      console.error('❌ Password field is missing from user object in DB!');
      return NextResponse.json(
        { success: false, error: 'Authentication error occurred (ERR_PWD_MISSING)' },
        { status: 401 }
      );
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password (ERR_PWD_INVALID)' },
        { status: 401 }
      );
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

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: userResponse },
      {
        status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed due to server error' },
      { status: 500 }
    );
  }
}
