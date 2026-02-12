import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTP from '@/models/OTP';
import { sendOTPEmail } from '@/lib/email';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
     });
}

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email domain
    const allowedDomains = ['cmtc.ac.th'];
    const domain = email.split('@')[1];
    
    if (!allowedDomains.includes(domain)) {
      return NextResponse.json(
        { success: false, error: 'Only cmtc email addresses are allowed' },
        { status: 400 }
      );
    }

    // Clean expired OTPs
    await OTP.cleanExpired();

    // Generate OTP
    const otp = generateOTP();
    const expires = new Date(Date.now() + (5 * 60 * 1000)); // 5 minutes

    // Store OTP in database
    await OTP.create({
      email,
      otp,
      expires,
      attempts: 0,
      isUsed: false
    });

    // Send OTP via email using Brevo
    try {

      
      await sendOTPEmail({ email, otp });
    } catch (emailError: unknown) {
      console.error('❌ Failed to send OTP email:', emailError);

      const emailErr = emailError as {
        message?: unknown;
        status?: unknown;
        response?: { status?: unknown; body?: unknown; data?: unknown };
      };

      console.error('   Error message:', emailErr.message);
      console.error('   Error status:', emailErr.status || emailErr.response?.status);
      console.error(
        '   Error response:',
        emailErr.response?.body || emailErr.response?.data
      );
      
      // Log OTP to console as fallback for debugging
      
      // Return error response instead of success
      // This will help frontend know that email sending failed
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send OTP email. Please check server logs for details.',
          errorDetails: process.env.NODE_ENV === 'development'
            ? {
                message: emailErr.message,
                status: emailErr.status || emailErr.response?.status
              }
            : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      data: { email }
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
