import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Portfolio from '@/models/Portfolio';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

interface AuthTokenPayload extends jwt.JwtPayload {
    userId: string;
    email: string;
    role: 'admin' | 'user' | 'company' | 'teacher';
    username?: string;
}

// GET /api/comments?portfolioId=X - Get comments for a portfolio
// ทำให้เป็น public (ไม่ต้องส่ง JWT ก็อ่านได้) แต่ใช้ JWT ถ้ามี เพื่อคำนวณ canDelete
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Get portfolioId from query params
        const { searchParams } = new URL(request.url);
        const portfolioId = searchParams.get('portfolioId');

        if (!portfolioId) {
            return NextResponse.json(
                { success: false, error: 'Portfolio ID is required' },
                { status: 400 }
            );
        }

        // พยายามอ่าน user จาก JWT ถ้ามี (optional)
        const authHeader = request.headers.get('authorization');
        let decoded: AuthTokenPayload | null = null;

        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                decoded = jwt.verify(
                    token,
                    process.env.JWT_SECRET || 'fallback-secret'
                ) as AuthTokenPayload;
            } catch {
                decoded = null;
            }
        }

        // Get portfolio (ถ้าไม่มี = 404)
        const portfolio = await Portfolio.findOne({ id: parseInt(portfolioId) });
        if (!portfolio) {
            return NextResponse.json(
                { success: false, error: 'Portfolio not found' },
                { status: 404 }
            );
        }

        // Get all comments for this portfolio (ไม่ filter การมองเห็นแล้ว)
        const allComments = await Comment.find({ portfolioId: parseInt(portfolioId) })
            .sort({ createdAt: -1 });

        // ดึง user ปัจจุบันตาม authorEmail เพื่อใช้ username ล่าสุด
        const authorEmails = Array.from(new Set(allComments.map(c => c.authorEmail)));
        const users = await User.find({ email: { $in: authorEmails } }).select('email username');
        const userMap = new Map<string, string>();
        users.forEach((u) => {
            const userDoc = u as { email: string; username: string };
            userMap.set(userDoc.email, userDoc.username);
        });

        // ใส่ canDelete และใช้ username ล่าสุด จาก User ถ้ามี
        const commentsWithPermissions = allComments.map((comment) => {
            const canDelete = !!decoded && (
                comment.authorEmail === decoded.email ||
                portfolio.submittedBy === decoded.email ||
                decoded.role === 'admin'
            );

            const latestUsername =
                userMap.get(comment.authorEmail) ||
                comment.authorName ||
                (comment.authorEmail?.split('@')[0] ?? '');

            return {
                id: comment.id,
                portfolioId: comment.portfolioId,
                authorEmail: comment.authorEmail,
                authorName: latestUsername,
                authorRole: comment.authorRole,
                content: comment.content,
                createdAt: comment.createdAt,
                canDelete
            };
        });

        return NextResponse.json({
            success: true,
            data: commentsWithPermissions
        });

    } catch (error: unknown) {
        console.error('Error fetching comments:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch comments',
                detailed: message,
                stack
            },
            { status: 500 }
        );
    }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
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
            const { portfolioId, content } = body;

            // Validation
            if (!portfolioId || !content) {
                return NextResponse.json(
                    { success: false, error: 'Portfolio ID and content are required' },
                    { status: 400 }
                );
            }

            if (content.trim().length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Comment cannot be empty' },
                    { status: 400 }
                );
            }

            if (content.length > 500) {
                return NextResponse.json(
                    { success: false, error: 'Comment is too long (max 500 characters)' },
                    { status: 400 }
                );
            }

            // Check if portfolio exists
            const portfolio = await Portfolio.findOne({ id: parseInt(portfolioId) });
            if (!portfolio) {
                return NextResponse.json(
                    { success: false, error: 'Portfolio not found' },
                    { status: 404 }
                );
            }

            // Get next ID
            const lastComment = await Comment.findOne().sort({ id: -1 });
            const nextId = lastComment ? lastComment.id + 1 : 1;

            // ใช้ username ล่าสุดจากตาราง User แทนที่จะพึ่ง payload ใน token
            const userDoc = await User.findById(decoded.userId).select('username email role');

            const comment = await Comment.create({
                id: nextId,
                portfolioId: parseInt(portfolioId),
                authorEmail: decoded.email,
                authorName: userDoc?.username || decoded.username || decoded.email.split('@')[0],
                authorRole: userDoc?.role ?? decoded.role ?? 'user',
                content: content.trim()
            });

            return NextResponse.json({
                success: true,
                data: {
                    id: comment.id,
                    portfolioId: comment.portfolioId,
                    authorEmail: comment.authorEmail,
                    authorName: comment.authorName,
                    authorRole: comment.authorRole,
                    content: comment.content,
                    createdAt: comment.createdAt,
                    canDelete: true
                }
            });

        } catch (jwtError: unknown) {
            console.error('JWT verification failed:', jwtError);
            const message =
                jwtError instanceof Error ? jwtError.message : 'Invalid or expired token';
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token', detailed: message },
                { status: 401 }
            );
        }
    } catch (error: unknown) {
        console.error('Error creating comment:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create comment',
                detailed: message,
                stack
            },
            { status: 500 }
        );
    }
}
