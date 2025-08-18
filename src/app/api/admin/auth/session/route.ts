import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthServerService } from '@/services/auth/admin-auth-server.service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Vérifier la session admin actuelle
    const adminContext = await AdminAuthServerService.getCurrentAdminSession();

    if (adminContext) {
      return NextResponse.json({
        authenticated: true,
        admin: {
          email: adminContext.email,
          role: adminContext.role,
          permissions: adminContext.permissions
        }
      });
    } else {
      return NextResponse.json({
        authenticated: false,
        admin: null
      });
    }

  } catch (error) {
    logger.error('Admin session API: Server error', error as Error, {
      component: 'AdminSessionAPI'
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Autres méthodes non autorisées
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}