import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTP from '@/models/OTP';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
     });
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, otp } = await request.json();
    
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find valid OTP in database
    const otpRecord = await OTP.findValidOTP(email, otp);
    
    if (!otpRecord) {
      // Check if there's an OTP record but it's invalid
      const existingOTP = await OTP.findOne({ email, isUsed: false });
      
      if (existingOTP) {
        // Increment attempts
        await existingOTP.incrementAttempts();
        
        if (existingOTP.attempts >= 5) {
          await existingOTP.markAsUsed();
          return NextResponse.json(
            { success: false, error: 'Too many attempts. Please request a new OTP.' },
            { status: 400 }
          );
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check attempts limit
    if (otpRecord.attempts >= 5) {
      await otpRecord.markAsUsed();
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // OTP is valid, mark as used
    await otpRecord.markAsUsed();

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      data: { email, verified: true }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
