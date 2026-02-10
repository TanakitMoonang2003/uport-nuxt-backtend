import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Portfolio from '@/models/Portfolio';

// GET /api/portfolio/[id] - Get portfolio item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const portfolio = await Portfolio.findOne({ id: parseInt(params.id) });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

// PUT /api/portfolio/[id] - Update portfolio item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Get user from JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        {
          status: 401, headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

      console.log('🔐 User attempting to update portfolio:', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        portfolioId: params.id
      });

      // Get existing portfolio
      const existingPortfolio = await Portfolio.findOne({ id: parseInt(params.id) });

      if (!existingPortfolio) {
        return NextResponse.json(
          { success: false, error: 'Portfolio not found' },
          {
            status: 404, headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }

      // Check ownership (allow owner or admin)
      if (existingPortfolio.submittedBy !== decoded.email && decoded.role !== 'admin') {
        console.log('❌ Permission denied:', {
          portfolioOwner: existingPortfolio.submittedBy,
          requestingUser: decoded.email,
          userRole: decoded.role
        });

        return NextResponse.json(
          { success: false, error: 'You do not have permission to edit this portfolio' },
          {
            status: 403, headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }

      console.log('✅ Authorization successful - updating portfolio');

      const body = await request.json();

      // Update portfolio
      const portfolio = await Portfolio.findOneAndUpdate(
        { id: parseInt(params.id) },
        body,
        { new: true, runValidators: true }
      );

      console.log('✅ Portfolio updated successfully:', portfolio.id);

      return NextResponse.json({
        success: true,
        data: portfolio
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });

    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        {
          status: 401, headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update portfolio' },
      {
        status: 500, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// DELETE /api/portfolio/[id] - Delete portfolio item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const portfolio = await Portfolio.findOneAndDelete({ id: parseInt(params.id) });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete portfolio' },
      { status: 500 }
    );
  }
}
