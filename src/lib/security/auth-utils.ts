import { AuthError, PermissionError } from '@/lib/errors/custom-errors';
import { logger } from '@/lib/logger';
import { createClientServer } from '@/lib/supabase/server';
import { AuthUser } from '@/types/business';
import { ServiceResult } from '@/types/common';
import { UserRole } from '@/types/enums';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Authentication and authorization utilities for server actions
 */

export interface AuthContext {
  user: AuthUser;
  permissions: string[];
}

export interface AuthOptions {
  requireAuth?: boolean;
  requiredRole?: UserRole;
  requiredPermissions?: string[];
  allowSelf?: boolean; // Allow user to access their own resources
}

/**
 * Maps Supabase user to AuthUser
 */
async function mapSupabaseUserToAuthUser(supabaseUser: SupabaseUser): Promise<AuthUser> {
  const supabase = await createClientServer();
  
  // Get customer data if available
  let customerData = null;
  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    customerData = customer;
  } catch (error) {
    // Customer data is optional
    logger.debug('Customer data not found for user', {
      action: 'mapSupabaseUserToAuthUser',
      userId: supabaseUser.id,
    });
  }

  const role = supabaseUser.user_metadata?.role || 
               supabaseUser.app_metadata?.role || 
               UserRole.CUSTOMER;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    role,
    firstName: customerData?.first_name || supabaseUser.user_metadata?.first_name || '',
    lastName: customerData?.last_name || supabaseUser.user_metadata?.last_name || '',
    avatarUrl: supabaseUser.user_metadata?.avatar_url,
  };
}

/**
 * Gets the current authenticated user
 */
export async function getCurrentUser(): Promise<ServiceResult<AuthUser | null>> {
  try {
    const supabase = await createClientServer();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      logger.debug('No authenticated user found', { 
        action: 'getCurrentUser',
        error: error.message 
      });
      return { success: true, data: null };
    }

    if (!data.user) {
      return { success: true, data: null };
    }

    const authUser = await mapSupabaseUserToAuthUser(data.user);
    return { success: true, data: authUser };
  } catch (error) {
    logger.error('Error getting current user', error as Error, {
      action: 'getCurrentUser',
    });

    return {
      success: false,
      error: {
        message: 'Failed to get current user',
        code: 'AUTH_ERROR',
      },
    };
  }
}

/**
 * Requires authentication and returns the authenticated user
 */
export async function requireAuth(): Promise<AuthUser> {
  const userResult = await getCurrentUser();
  
  if (!userResult.success) {
    throw new AuthError('Authentication failed', 'AUTH_ERROR');
  }

  if (!userResult.data) {
    throw new AuthError('Authentication required', 'NOT_AUTHENTICATED');
  }

  return userResult.data;
}

/**
 * Gets user permissions based on role
 */
export function getUserPermissions(role: UserRole): string[] {
  const rolePermissions: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: ['*'], // All permissions
    [UserRole.MODERATOR]: [
      'products:read',
      'products:write',
      'orders:read',
      'orders:update',
      'users:read',
    ],
    [UserRole.CUSTOMER]: [
      'cart:read',
      'cart:write',
      'orders:read',
      'orders:create',
      'profile:read',
      'profile:write',
    ],
  };

  return rolePermissions[role] || [];
}

/**
 * Checks if user has specific permission
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const permissions = getUserPermissions(userRole);
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Requires specific permission and returns the authenticated user
 */
export async function requirePermission(permission: string): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (!hasPermission(user.role, permission)) {
    logger.warn('Permission denied', {
      action: 'requirePermission',
      userId: user.id,
      userRole: user.role,
      requiredPermission: permission,
    });
    
    throw new PermissionError(
      `Permission denied: ${permission}`,
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  return user;
}

/**
 * Requires specific role and returns the authenticated user
 */
export async function requireRole(role: UserRole): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (user.role !== role && user.role !== UserRole.ADMIN) {
    logger.warn('Role requirement not met', {
      action: 'requireRole',
      userId: user.id,
      userRole: user.role,
      requiredRole: role,
    });
    
    throw new PermissionError(
      `Role required: ${role}`,
      'INSUFFICIENT_ROLE'
    );
  }

  return user;
}

/**
 * Checks if user can access resource (either has permission or owns the resource)
 */
export async function requireResourceAccess(
  resourceUserId: string,
  permission: string
): Promise<AuthUser> {
  const user = await requireAuth();
  
  // User can access their own resources
  if (user.id === resourceUserId) {
    return user;
  }
  
  // Otherwise check permission
  if (!hasPermission(user.role, permission)) {
    logger.warn('Resource access denied', {
      action: 'requireResourceAccess',
      userId: user.id,
      resourceUserId,
      permission,
    });
    
    throw new PermissionError(
      'Access denied to this resource',
      'RESOURCE_ACCESS_DENIED'
    );
  }

  return user;
}

/**
 * Creates auth context with user and permissions
 */
export async function createAuthContext(): Promise<AuthContext> {
  const user = await requireAuth();
  const permissions = getUserPermissions(user.role);
  
  return {
    user,
    permissions,
  };
}

/**
 * Validates auth requirements based on options
 */
export async function validateAuthRequirements(
  options: AuthOptions,
  resourceUserId?: string
): Promise<AuthUser | null> {
  if (!options.requireAuth) {
    // No auth required, but return user if available
    const userResult = await getCurrentUser();
    return userResult.data || null;
  }

  let user = await requireAuth();

  // Check role requirement
  if (options.requiredRole) {
    user = await requireRole(options.requiredRole);
  }

  // Check permission requirements
  if (options.requiredPermissions?.length) {
    for (const permission of options.requiredPermissions) {
      if (!hasPermission(user.role, permission)) {
        throw new PermissionError(
          `Permission denied: ${permission}`,
          'INSUFFICIENT_PERMISSIONS'
        );
      }
    }
  }

  // Check resource access
  if (resourceUserId && options.allowSelf) {
    user = await requireResourceAccess(resourceUserId, options.requiredPermissions?.[0] || 'read');
  }

  return user;
}