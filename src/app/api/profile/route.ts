import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// GET /api/profile - Get current user profile
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Get user from JWT token
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401, headers: corsHeaders }
            );
        }

        try {
            const token = authHeader.replace('Bearer ', '');
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

            // Get user data (exclude password)
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return NextResponse.json(
                    { success: false, error: 'User not found' },
                    { status: 404, headers: corsHeaders }
                );
            }


            return NextResponse.json({
                success: true,
                data: user
            }, { headers: corsHeaders });

        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError);
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401, headers: corsHeaders }
            );
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch profile' },
            { status: 500, headers: corsHeaders }
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
                { status: 401, headers: corsHeaders }
            );
        }

        try {
            const token = authHeader.replace('Bearer ', '');
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

            const body = await request.json();

            // Validate profile picture if provided
            if (body.profilePicture) {
                // Check if it's a valid base64 image
                if (!body.profilePicture.startsWith('data:image/')) {
                    return NextResponse.json(
                        { success: false, error: 'Invalid profile picture format' },
                        { status: 400, headers: corsHeaders }
                    );
                }

                // Check size (base64 string length, roughly 2MB = ~2.7M chars)
                if (body.profilePicture.length > 3000000) {
                    return NextResponse.json(
                        { success: false, error: 'Profile picture too large (max 2MB)' },
                        { status: 400, headers: corsHeaders }
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
            const updates: any = {};
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
                    { status: 404, headers: corsHeaders }
                );
            }


            return NextResponse.json({
                success: true,
                data: user
            }, { headers: corsHeaders });

        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError);
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401, headers: corsHeaders }
            );
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update profile' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// OPTIONS for CORS
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}
