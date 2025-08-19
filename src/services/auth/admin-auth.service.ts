'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isAdminEmail, createAdminContext, logAdminAction } from '@/lib/auth/admin-auth';
import { logger } from '@/lib/logger';
import { BusinessError } from '@/lib/errors';

export interface AdminLoginResult {
  success: boolean;
  error?: string;
  adminContext?: any;
}

// Server Action pour la connexion admin
export async function signInAdmin(email: string, password: string): Promise<AdminLoginResult> {
  try {
    // Vérifier d'abord si l'email est celui de l'admin
    if (!isAdminEmail(email)) {
      logger.warn('Admin login attempt with non-admin email', {
        component: 'AdminAuthService',
        attemptedEmail: email,
        action: 'signInAdmin',
      });

      return {
        success: false,
        error: 'Invalid admin credentials',
      };
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
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
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
        component: 'AdminAuthService',
        email,
        action: 'signInAdmin',
      });

      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Authentication failed',
      };
    }

    // Double vérification que l'utilisateur connecté est bien l'admin
    if (!isAdminEmail(data.user.email || '')) {
      logger.error('Security breach: Non-admin user authenticated as admin', undefined, {
        component: 'AdminAuthService',
        userEmail: data.user.email,
        action: 'signInAdmin',
      });

      // Déconnecter immédiatement
      await supabase.auth.signOut();

      return {
        success: false,
        error: 'Access denied',
      };
    }

    // Créer le contexte admin
    const adminContext = createAdminContext(data.user);

    // Logger la connexion admin réussie
    logAdminAction('admin_login_success', data.user);

    logger.info('Admin login successful', {
      component: 'AdminAuthService',
      adminEmail: data.user.email,
      action: 'signInAdmin',
    });

    return {
      success: true,
      adminContext,
    };
  } catch (error) {
    logger.error('Admin login service error', error as Error, {
      component: 'AdminAuthService',
      email,
      action: 'signInAdmin',
    });

    return {
      success: false,
      error: 'Service error',
    };
  }
}

// Server Action pour la déconnexion admin
export async function signOutAdmin(): Promise<{ success: boolean; error?: string }> {
  try {
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
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    // Récupérer la session actuelle pour logger
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      logAdminAction('admin_logout', session.user);
    }

    // Déconnexion
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Admin logout failed', error, {
        component: 'AdminAuthService',
        action: 'signOutAdmin',
      });

      return {
        success: false,
        error: 'Logout failed',
      };
    }

    logger.info('Admin logout successful', {
      component: 'AdminAuthService',
      action: 'signOutAdmin',
    });

    return { success: true };
  } catch (error) {
    logger.error('Admin logout service error', error as Error, {
      component: 'AdminAuthService',
      action: 'signOutAdmin',
    });

    return {
      success: false,
      error: 'Service error',
    };
  }
}

// Server Action pour vérifier la session admin actuelle
export async function getCurrentAdminSession() {
  try {
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
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      logger.error('Failed to get admin session', error, {
        component: 'AdminAuthService',
        action: 'getCurrentAdminSession',
      });
      return null;
    }

    if (!session || !session.user) {
      return null;
    }

    // Vérifier que c'est bien l'admin
    if (!isAdminEmail(session.user.email || '')) {
      logger.warn('Non-admin session found in admin context', {
        component: 'AdminAuthService',
        userEmail: session.user.email,
        action: 'getCurrentAdminSession',
      });
      return null;
    }

    return createAdminContext(session.user);
  } catch (error) {
    logger.error('Admin session service error', error as Error, {
      component: 'AdminAuthService',
      action: 'getCurrentAdminSession',
    });
    return null;
  }
}

// Server Action pour valider qu'une action peut être effectuée par l'admin actuel
export async function validateAdminAction(action: string, requiredPermission?: string) {
  const adminContext = await getCurrentAdminSession();

  if (!adminContext) {
    throw new BusinessError('Admin authentication required', 'ADMIN_AUTH_REQUIRED');
  }

  if (requiredPermission && adminContext.permissions && !adminContext.permissions.includes(requiredPermission as any)) {
    logger.warn('Admin permission denied', {
      component: 'AdminAuthService',
      adminEmail: adminContext.email,
      action,
      requiredPermission,
    });
    throw new BusinessError('Insufficient admin permissions', 'ADMIN_PERMISSION_DENIED');
  }

  logAdminAction(action, adminContext.user, { requiredPermission });
  return adminContext;
}
