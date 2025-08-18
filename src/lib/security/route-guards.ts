import { AuthError, PermissionError } from '@/lib/errors/custom-errors';
import { logger } from '@/lib/logger';
import { AuthUser } from '@/types/business';
import { UserRole } from '@/types/enums';
import { redirect } from 'next/navigation';
import React from 'react';
import { getCurrentUser } from './auth-utils';
import { Permission, hasPermission, isRoleHigherOrEqual } from './rbac';

/**
 * Route Guards for protecting pages and API routes
 */

export interface RouteGuardOptions {
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  allowedRoles?: UserRole[];
  redirectTo?: string;
  requireAuth?: boolean;
}

export interface GuardResult {
  allowed: boolean;
  user?: AuthUser;
  redirectTo?: string;
  error?: string;
}

/**
 * Main route guard function
 */
export async function guardRoute(options: RouteGuardOptions = {}): Promise<GuardResult> {
  const {
    requiredRole,
    requiredPermissions = [],
    allowedRoles = [],
    redirectTo = '/auth/login',
    requireAuth = true,
  } = options;

  try {
    // Get current user
    const userResult = await getCurrentUser();
    
    if (!userResult.success || !userResult.data) {
      if (requireAuth) {
        logger.warn('Route access denied - not authenticated', {
          action: 'guardRoute',
          options,
        });
        
        return {
          allowed: false,
          redirectTo,
          error: 'Authentication required',
        };
      }
      
      // Allow access for public routes
      return { allowed: true };
    }

    const user = userResult.data;

    // Check role requirements
    if (requiredRole && !isRoleHigherOrEqual(user.role, requiredRole)) {
      logger.warn('Route access denied - insufficient role', {
        action: 'guardRoute',
        userId: user.id,
        userRole: user.role,
        requiredRole,
      });
      
      return {
        allowed: false,
        user,
        redirectTo: '/unauthorized',
        error: `Role ${requiredRole} required`,
      };
    }

    // Check allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      logger.warn('Route access denied - role not in allowed list', {
        action: 'guardRoute',
        userId: user.id,
        userRole: user.role,
        allowedRoles,
      });
      
      return {
        allowed: false,
        user,
        redirectTo: '/unauthorized',
        error: 'Access denied for this role',
      };
    }

    // Check permission requirements
    for (const permission of requiredPermissions) {
      if (!hasPermission(user.role, permission)) {
        logger.warn('Route access denied - missing permission', {
          action: 'guardRoute',
          userId: user.id,
          userRole: user.role,
          requiredPermission: permission,
        });
        
        return {
          allowed: false,
          user,
          redirectTo: '/unauthorized',
          error: `Permission ${permission} required`,
        };
      }
    }

    // All checks passed
    logger.debug('Route access granted', {
      action: 'guardRoute',
      userId: user.id,
      userRole: user.role,
    });

    return {
      allowed: true,
      user,
    };
  } catch (error) {
    logger.error('Error in route guard', error as Error, {
      action: 'guardRoute',
      options,
    });

    return {
      allowed: false,
      redirectTo: '/error',
      error: 'Route guard error',
    };
  }
}

/**
 * Require authentication for a route
 */
export async function requireAuth(): Promise<AuthUser> {
  const result = await guardRoute({ requireAuth: true });
  
  if (!result.allowed) {
    if (result.redirectTo) {
      redirect(result.redirectTo);
    }
    throw new AuthError(result.error || 'Authentication required', 'NOT_AUTHENTICATED');
  }
  
  return result.user!;
}

/**
 * Require specific role for a route
 */
export async function requireRole(role: UserRole): Promise<AuthUser> {
  const result = await guardRoute({ requiredRole: role });
  
  if (!result.allowed) {
    if (result.redirectTo) {
      redirect(result.redirectTo);
    }
    throw new PermissionError(result.error || `Role ${role} required`, 'INSUFFICIENT_ROLE');
  }
  
  return result.user!;
}

/**
 * Require specific permissions for a route
 */
export async function requirePermissions(permissions: Permission[]): Promise<AuthUser> {
  const result = await guardRoute({ requiredPermissions: permissions });
  
  if (!result.allowed) {
    if (result.redirectTo) {
      redirect(result.redirectTo);
    }
    throw new PermissionError(
      result.error || `Permissions required: ${permissions.join(', ')}`,
      'INSUFFICIENT_PERMISSIONS'
    );
  }
  
  return result.user!;
}

/**
 * Admin route guard
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(UserRole.ADMIN);
}

/**
 * Moderator or higher route guard
 */
export async function requireModerator(): Promise<AuthUser> {
  return requireRole(UserRole.MODERATOR);
}

/**
 * Customer or higher route guard (basically any authenticated user)
 */
export async function requireCustomer(): Promise<AuthUser> {
  return requireRole(UserRole.CUSTOMER);
}

/**
 * Check if current user can access admin routes
 */
export async function canAccessAdmin(): Promise<boolean> {
  const result = await guardRoute({ requiredRole: UserRole.ADMIN });
  return result.allowed;
}

/**
 * Check if current user can access moderator routes
 */
export async function canAccessModerator(): Promise<boolean> {
  const result = await guardRoute({ requiredRole: UserRole.MODERATOR });
  return result.allowed;
}

/**
 * Higher-order component for protecting pages
 */
export function withRouteGuard<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  guardOptions: RouteGuardOptions
) {
  return async function GuardedComponent(props: T) {
    const result = await guardRoute(guardOptions);
    
    if (!result.allowed) {
      if (result.redirectTo) {
        redirect(result.redirectTo);
      }
      
      // Return error component or throw error
      throw new Error(result.error || 'Access denied');
    }
    
    // Pass user data to component if available
    const enhancedProps = result.user 
      ? { ...props, currentUser: result.user }
      : props;
    
    return React.createElement(Component, enhancedProps);
  };
}

/**
 * Utility functions for common route patterns
 */
export const RouteGuards = {
  // Public routes (no auth required)
  public: () => guardRoute({ requireAuth: false }),
  
  // Authenticated routes
  authenticated: () => guardRoute({ requireAuth: true }),
  
  // Admin only routes
  adminOnly: () => guardRoute({ requiredRole: UserRole.ADMIN }),
  
  // Moderator and admin routes
  moderatorOrAdmin: () => guardRoute({ 
    allowedRoles: [UserRole.MODERATOR, UserRole.ADMIN] 
  }),
  
  // Customer routes (any authenticated user)
  customerOrHigher: () => guardRoute({ requiredRole: UserRole.CUSTOMER }),
  
  // Product management routes
  productManagement: () => guardRoute({ 
    requiredPermissions: [Permission.PRODUCTS_WRITE] 
  }),
  
  // Order management routes
  orderManagement: () => guardRoute({ 
    requiredPermissions: [Permission.ORDERS_MANAGE_ALL] 
  }),
  
  // User management routes
  userManagement: () => guardRoute({ 
    requiredPermissions: [Permission.USERS_MANAGE_ALL] 
  }),
};

/**
 * Middleware helper for API routes
 */
export async function apiRouteGuard(
  request: Request,
  options: RouteGuardOptions = {}
): Promise<{ allowed: boolean; user?: AuthUser; response?: Response }> {
  const result = await guardRoute(options);
  
  if (!result.allowed) {
    const status = result.error?.includes('Authentication') ? 401 : 403;
    
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ 
          error: result.error || 'Access denied',
          code: status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
        }),
        { 
          status,
          headers: { 'Content-Type': 'application/json' }
        }
      ),
    };
  }
  
  return {
    allowed: true,
    user: result.user,
  };
}