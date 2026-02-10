import { NextRequest, NextResponse } from 'next/server';
import { testConnection, seedDatabase, getDatabaseStats, clearDatabase } from '@/lib/db-utils';

// GET /api/test-db - Test database connection and operations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'test';

    let result;
    
    switch (action) {
      case 'test':
        result = await testConnection();
        break;
      case 'seed':
        result = await seedDatabase();
        break;
      case 'stats':
        result = await getDatabaseStats();
        break;
      case 'clear':
        result = await clearDatabase();
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: test, seed, stats, or clear' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      message: `Database ${action} operation completed`
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
