import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET /api/user/profile/[email] - Get public user profile by email
export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    await connectDB();

    const { email } = params;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: decodeURIComponent(email) }).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return only public-safe information
    const publicProfile = {
      _id: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      skills: user.skills || [],
      portfolioFiles: user.portfolioFiles || [],
      phone: user.phone,
      yearOfStudy: user.yearOfStudy,
      department: user.department,
      studentId: user.studentId,
      createdAt: user.createdAt
    };

    return NextResponse.json({
      success: true,
      data: publicProfile
    });
  } catch (error: any) {
    console.error('Error fetching public user profile:', error);
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
