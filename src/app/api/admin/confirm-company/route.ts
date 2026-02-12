import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
     });
}

// POST /api/admin/confirm-company - Approve or reject company
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { companyId, action } = body;
    
    if (!companyId || !action) {
      return NextResponse.json(
        { success: false, error: 'Company ID and action are required' },
        { status: 400 }
      );
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }
    
    // Find the company
    const company = await User.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }
    
    if (company.role !== 'company') {
      return NextResponse.json(
        { success: false, error: 'User is not a company' },
        { status: 400 }
      );
    }
    
    // Update company status
    if (action === 'approve') {
      company.isCompanyApproved = true;
      company.isActive = true;
    } else {
      // For reject, you might want to delete the user or mark as rejected
      company.isActive = false;
    }
    
    await company.save();
    return NextResponse.json({
      success: true,
      message: `Company ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: {
        id: company._id,
        email: company.email,
        isCompanyApproved: company.isCompanyApproved,
        isActive: company.isActive
      }
    });
  } catch (error) {
    console.error('Error confirming company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to confirm company' },
      { status: 500 }
    );
  }
}









