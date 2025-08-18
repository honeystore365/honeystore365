import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthServerService } from '@/services/auth/admin-auth-server.service';
import { isAdminEmail } from '@/lib/auth/admin-auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation des données d'entrée
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Vérification que l'email est celui de l'admin
    if (!isAdminEmail(email)) {
      logger.warn('Admin login API: Non-admin email attempted', {
        component: 'AdminLoginAPI',
        attemptedEmail: email,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
      
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Tentative de connexion admin
    const result = await AdminAuthServerService.signInAdmin(email, password);

    if (result.success) {
      logger.info('Admin login API: Success', {
        component: 'AdminLoginAPI',
        adminEmail: email
      });

      return NextResponse.json({
        success: true,
        message: 'Admin login successful',
        admin: result.adminContext
      });
    } else {
      logger.warn('Admin login API: Failed', {
        component: 'AdminLoginAPI',
        email,
        error: result.error
      });

      return NextResponse.json(
        { error: result.error || 'Login failed' },
        { status: 401 }
      );
    }

  } catch (error) {
    logger.error('Admin login API: Server error', error as Error, {
      component: 'AdminLoginAPI'
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