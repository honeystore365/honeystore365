import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthServerService } from '@/services/auth/admin-auth-server.service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Déconnexion admin
    const result = await AdminAuthServerService.signOutAdmin();

    if (result.success) {
      logger.info('Admin logout API: Success', {
        component: 'AdminLogoutAPI'
      });

      return NextResponse.json({
        success: true,
        message: 'Admin logout successful'
      });
    } else {
      logger.error('Admin logout API: Failed', undefined, {
        component: 'AdminLogoutAPI',
        error: result.error
      });

      return NextResponse.json(
        { error: result.error || 'Logout failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('Admin logout API: Server error', error as Error, {
      component: 'AdminLogoutAPI'
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Méthode GET non autorisée
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}