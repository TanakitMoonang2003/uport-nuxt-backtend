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

// GET /api/profile - Get current user profile
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Get user from JWT token
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        try {
            const token = authHeader.replace('Bearer ', '');
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'fallback-secret'
            ) as AuthTokenPayload;

            // Get user data (exclude password)
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return NextResponse.json(
                    { success: false, error: 'User not found' },
                    { status: 404 }
                );
            }


            return NextResponse.json({
                success: true,
                data: user
            }, {});

        } catch (jwtError: unknown) {
            console.error('JWT verification failed:', jwtError);
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
    try {
        await connectDB();

        // Get user from JWT token
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        try {
            const token = authHeader.replace('Bearer ', '');
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'fallback-secret'
            ) as AuthTokenPayload;

            const body = await request.json();

            // Validate profile picture if provided
            if (body.profilePicture) {
                // Check if it's a valid base64 image
                if (!body.profilePicture.startsWith('data:image/')) {
                    return NextResponse.json(
                        { success: false, error: 'Invalid profile picture format' },
                        { status: 400 }
                    );
                }

                // Check size (base64 string length, roughly 2MB = ~2.7M chars)
                if (body.profilePicture.length > 3000000) {
                    return NextResponse.json(
                        { success: false, error: 'Profile picture too large (max 2MB)' },
                        { status: 400 }
                    );
                }
            }

            // Fields that can be updated
            const allowedUpdates = [
                'firstName',
                'lastName',
                'phone',
                'profilePicture',
                'yearOfStudy',
                'faculty',
                'department',
                'position',
                'officeRoom',
                'officePhone',
                'specialization',
                'industry',
                'address',
                'description'
            ];

            // Filter only allowed fields
            const updates: Record<string, unknown> = {};
            for (const key of allowedUpdates) {
                if (body[key] !== undefined) {
                    updates[key] = body[key];
                }
            }

            // Update user
            const user = await User.findByIdAndUpdate(
                decoded.userId,
                updates,
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
                data: user
            }, {});

        } catch (jwtError: unknown) {
            console.error('JWT verification failed:', jwtError);
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}

