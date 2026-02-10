import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

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

// GET /api/admin/pending-companies - Get all pending company requests
export async function GET() {
  try {
    await connectDB();
    
    console.log('=== FETCHING PENDING COMPANIES ===');
    
    // Find all companies that are not approved
    const pendingCompanies = await User.find({
      role: 'company',
      isCompanyApproved: { $ne: true }
    }).select('-password');
    
    console.log('Found pending companies:', pendingCompanies.length);
    console.log('Pending companies:', pendingCompanies);
    
    return NextResponse.json({
      success: true,
      data: pendingCompanies,
      count: pendingCompanies.length
    });
  } catch (error) {
    console.error('Error fetching pending companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending companies' },
      { status: 500 }
    );
  }
}









