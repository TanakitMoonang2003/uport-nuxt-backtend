import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

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
      ...additionalData 
    } = body;

    // Debug logging
    console.log('Registration request body:', body);
    console.log('Email:', email);
    console.log('Username:', username);
    console.log('Password length:', password?.length);
    console.log('ConfirmPassword provided:', !!confirmPassword);
    console.log('UserType:', userType);

    // Validation
    if (!email || !username || !password) {
      console.log('Missing required fields - email:', !!email, 'username:', !!username, 'password:', !!password);
      return NextResponse.json(
        { success: false, error: 'Email, username, and password are required' },
        { status: 400 }
      );
    }

    // Only check password match if confirmPassword is provided
    if (confirmPassword && password !== confirmPassword) {
      console.log('Password mismatch - password:', password, 'confirmPassword:', confirmPassword);
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.log('Password too short:', password.length);
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

    // Create user data
    const userData = {
      email,
      username,
      password,
      role: userType === 'teacher' ? 'teacher' : userType === 'company' ? 'company' : 'user',
      isActive: true,
      // For teachers, set confirmation status to false initially
      ...(userType === 'teacher' && { isTeacherConfirmed: false }),
      // For companies, set approval status to false initially
      ...(userType === 'company' && { isCompanyApproved: false }),
      ...additionalData
    };

    // Create new user
    console.log('Creating user with data:', userData);
    const user = new User(userData);
    
    try {
      await user.save();
      console.log('User created successfully:', user._id);
    } catch (saveError) {
      console.error('User creation error:', saveError);
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
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
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
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
