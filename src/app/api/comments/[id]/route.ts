import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Portfolio from '@/models/Portfolio';
import jwt from 'jsonwebtoken';

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

            const commentId = parseInt(params.id);

            // Get the comment
            const comment = await Comment.findOne({ id: commentId });
            if (!comment) {
                return NextResponse.json(
                    { success: false, error: 'Comment not found' },
                    { status: 404 }
                );
            }

            // Get the portfolio to check ownership
            const portfolio = await Portfolio.findOne({ id: comment.portfolioId });
            if (!portfolio) {
                return NextResponse.json(
                    { success: false, error: 'Portfolio not found' },
                    { status: 404 }
                );
            }

            // Check delete permissions:
            // - Comment author can delete their own comment
            // - Portfolio owner can delete any comment on their portfolio
            // - Admin can delete any comment
            const canDelete =
                comment.authorEmail === decoded.email ||
                portfolio.submittedBy === decoded.email ||
                decoded.role === 'admin';

            if (!canDelete) {
                console.log('❌ Delete permission denied:', {
                    commentAuthor: comment.authorEmail,
                    portfolioOwner: portfolio.submittedBy,
                    requestingUser: decoded.email,
                    userRole: decoded.role
                });

                return NextResponse.json(
                    { success: false, error: 'You do not have permission to delete this comment' },
                    { status: 403 }
                );
            }

            // Delete the comment
            await Comment.deleteOne({ id: commentId });

            console.log('✅ Comment deleted:', commentId, 'by', decoded.email);

            return NextResponse.json({
                success: true,
                message: 'Comment deleted successfully'
            });

        } catch (jwtError: any) {
            console.error('JWT verification failed:', jwtError);
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token', detailed: jwtError.message },
                { status: 401 }
            );
        }
    } catch (error: any) {
        console.error('Error deleting comment:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete comment',
                detailed: error.message,
                stack: error.stack
            },
            { status: 500 }
        );
    }
}
