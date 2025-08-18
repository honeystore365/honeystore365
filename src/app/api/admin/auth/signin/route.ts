import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isAdminEmail, createAdminContext, logAdminAction } from '@/lib/auth/admin-auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Vérifier d'abord si l'email est celui de l'admin
    if (!isAdminEmail(email)) {
      logger.warn('Admin login attempt with non-admin email', {
        component: 'AdminAuthAPI',
        attemptedEmail: email,
        action: 'signInAdmin'
      });
      
      return NextResponse.json({
        success: false,
        error: 'Invalid admin credentials'
      });
    }

    // Créer le client Supabase serveur
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Tentative de connexion
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Admin login failed', error, {
        component: 'AdminAuthAPI',
        email,
        action: 'signInAdmin'
      });
      
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (!data.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed'
      });
    }

    // Double vérification que l'utilisateur connecté est bien l'admin
    if (!isAdminEmail(data.user.email || '')) {
      logger.error('Security breach: Non-admin user authenticated as admin', undefined, {
        component: 'AdminAuthAPI',
        userEmail: data.user.email,
        action: 'signInAdmin'
      });
      
      // Déconnecter immédiatement
      await supabase.auth.signOut();
      
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      });
    }

    // Créer le contexte admin
    const adminContext = createAdminContext(data.user);
    
    // Logger la connexion admin réussie
    logAdminAction('admin_login_success', data.user);
    
    logger.info('Admin login successful', {
      component: 'AdminAuthAPI',
      adminEmail: data.user.email,
      action: 'signInAdmin'
    });

    return NextResponse.json({
      success: true,
      adminContext
    });

  } catch (error) {
    logger.error('Admin login API error', error as Error, {
      component: 'AdminAuthAPI',
      action: 'signInAdmin'
    });
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}