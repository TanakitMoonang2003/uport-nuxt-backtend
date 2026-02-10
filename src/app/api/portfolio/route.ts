import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Portfolio from '@/models/Portfolio';
import jwt from 'jsonwebtoken';

interface AuthTokenPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'company' | 'teacher';
  username?: string;
}

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

// GET /api/portfolio - Get all portfolio items
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includePending = searchParams.get('includePending') === 'true'; // For admin/teacher

    // Check if user is admin or teacher (from Authorization header)
    let isAdminOrTeacher = false;
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'fallback-secret'
        ) as AuthTokenPayload;
        isAdminOrTeacher = decoded.role === 'admin' || decoded.role === 'teacher';
      }
    } catch {
      // Not authenticated or invalid token - treat as public user
      isAdminOrTeacher = false;
    }

    const query: Record<string, unknown> = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // For public users, only show approved portfolios
    // For admin/teacher, show all if includePending=true, otherwise only approved
    if (!isAdminOrTeacher || !includePending) {
      query.status = 'approved';
    }

    const portfolios = await Portfolio.find(query).sort({ id: 1 });

    return NextResponse.json({
      success: true,
      data: portfolios
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolios' },
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

// POST /api/portfolio - Create new portfolio item
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields (technologies and features are optional, will use defaults if empty)
    const requiredFields = ['category', 'title', 'description', 'fullDescription', 'duration', 'client'];
    const missingFields = requiredFields.filter(field => {
      return !body[field] || (typeof body[field] === 'string' && body[field].trim() === '');
    });

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          missingFields: missingFields
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    // Ensure image has a default value if empty
    if (!body.image || body.image.trim() === '') {
      // If uploadedFile is a base64 image, use it
      if (body.uploadedFile && body.uploadedFile.startsWith('data:image')) {
        body.image = body.uploadedFile;
      } else {
        body.image = 'https://placehold.co/800x600/FCD34D/1F2937?text=No+Image';
      }
    }

    // Ensure technologies and features are arrays (use defaults if empty or missing)
    const technologies = Array.isArray(body.technologies) && body.technologies.length > 0
      ? body.technologies
      : ['General'];
    const features = Array.isArray(body.features) && body.features.length > 0
      ? body.features
      : ['Portfolio Item'];

    // Get the highest ID and increment it
    const lastPortfolio = await Portfolio.findOne().sort({ id: -1 });
    const newId = lastPortfolio ? lastPortfolio.id + 1 : 1;

    // Set status to pending and get submittedBy from request (if available)
    const portfolio = new Portfolio({
      ...body,
      id: newId,
      technologies,
      features,
      status: 'pending', // Always set to pending when created
      submittedBy: body.submittedBy || '' // User ID or email who submitted
    });

    await portfolio.save();

    return NextResponse.json({
      success: true,
      data: portfolio
    }, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error: unknown) {
    console.error('❌ Error creating portfolio:');
    if (error instanceof Error) {
      console.error('   Error name:', error.name);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    } else {
      console.error('   Unknown error:', error);
    }

    // Handle validation errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: unknown }).name === 'ValidationError'
    ) {
      const validationErrors: Record<string, string> = {};
      const validationError = error as {
        errors?: Record<string, { message: string }>;
      };
      const fieldErrors = validationError.errors ?? {};
      Object.keys(fieldErrors).forEach(key => {
        validationErrors[key] = fieldErrors[key].message;
      });
      console.error('   Validation errors:', validationErrors);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          validationErrors: validationErrors
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    // Handle duplicate key errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000
    ) {
      const duplicateError = error as { keyPattern?: unknown };
      console.error('   Duplicate key error:', duplicateError.keyPattern);
      return NextResponse.json(
        {
          success: false,
          error: 'Portfolio with this ID already exists'
        },
        {
          status: 409,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    // Generic error
    return NextResponse.json(
        {
          success: false,
          error: 'Failed to create portfolio',
          details:
            process.env.NODE_ENV === 'development' && error instanceof Error
              ? error.message
              : undefined
        },
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
