import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
     });
}

// POST /api/auth/register - Register new user
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      email, 
      username, 
      password, 
      confirmPassword, 
      otpVerified = false,
      userType, // 'student' or 'teacher'
      role: _roleIgnored, // ignore role from body, always derive from userType
      ...additionalData 
    } = body;

 

    // Validation
    if (!email || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, username, and password are required' },
        { status: 400 }
      );
    }

    // Only check password match if confirmPassword is provided
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email domain for student and teacher only
    if (userType !== 'company') {
      const allowedDomains = ['cmtc.ac.th'];
      const domain = email.split('@')[1];
      
      if (!allowedDomains.includes(domain)) {
        return NextResponse.json(
          { success: false, error: 'Only cmtc email addresses are allowed' },
          { status: 400 }
        );
      }
    }

    // Check if OTP was verified (for security) - skip for companies
    if (userType !== 'company' && !otpVerified) {
      return NextResponse.json(
        { success: false, error: 'Email must be verified with OTP before registration' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email or username already exists' },
        { status: 409 }
      );
    }

    // Create user data - always derive role from userType, never trust role from body
    const resolvedRole = userType === 'teacher' ? 'teacher' : userType === 'company' ? 'company' : 'user';
    const userData = {
      email,
      username,
      password,
      role: resolvedRole,
      isActive: true,
      // For teachers, set confirmation status to false initially
      ...(userType === 'teacher' && { isTeacherConfirmed: false }),
      // For companies, set approval status to false initially
      ...(userType === 'company' && { isCompanyApproved: false }),
      ...additionalData
    };

    // Create new user
    const user = new User(userData);
    
    try {
      await user.save();
    } catch (saveError: unknown) {
      console.error('User creation error:', saveError);
      const err = saveError as { code?: number; message?: string; keyValue?: Record<string, unknown> };
      
      // Duplicate key error
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return NextResponse.json(
          { success: false, error: `${field} already exists` },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create user account', detail: err.message },
        { status: 500 }
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

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: userResponse
    }, { 
      status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { 
        status: 500 }
    );
  }
}
