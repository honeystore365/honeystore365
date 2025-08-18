import { BusinessError, ValidationError } from '@/lib/errors/custom-errors';
import { logger } from '@/lib/logger';
import { createClientServer } from '@/lib/supabase/server';
import { AuthUser, LoginCredentials, RegisterData, User, UserFilters } from '@/types/business';
import { ServiceResult } from '@/types/common';
import { UserRole } from '@/types/enums';
import { Tables } from '@/types/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthService } from './auth.types';

type CustomerRow = Tables<'customers'>;
type ProfileRow = Tables<'profiles'>;

export class AuthServiceImpl implements AuthService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes for user data

  private getCacheKey(operation: string, params?: any): string {
    return `auth_${operation}_${JSON.stringify(params || {})}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearUserCache(userId?: string): void {
    if (userId) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(userId));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async mapSupabaseUserToAuthUser(supabaseUser: SupabaseUser, customerData?: CustomerRow): Promise<AuthUser> {
    const role = supabaseUser.user_metadata?.role || supabaseUser.app_metadata?.role || UserRole.CUSTOMER;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      role,
      firstName: customerData?.first_name || supabaseUser.user_metadata?.first_name || '',
      lastName: customerData?.last_name || supabaseUser.user_metadata?.last_name || '',
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
    };
  }

  async signIn(credentials: LoginCredentials): Promise<ServiceResult<AuthUser>> {
    const startTime = Date.now();

    try {
      // Validation
      if (!credentials.email) {
        throw new ValidationError('Email is required', 'email', 'REQUIRED');
      }
      if (!credentials.password) {
        throw new ValidationError('Password is required', 'password', 'REQUIRED');
      }
      if (!this.validateEmail(credentials.email)) {
        throw new ValidationError('Invalid email format', 'email', 'INVALID');
      }

      const supabase = await createClientServer();

      // Attempt sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        logger.warn('Sign in failed', {
          action: 'signIn',
          email: credentials.email,
          error: error.message,
        });

        // Map Supabase auth errors to business errors
        if (error.message.includes('Invalid login credentials')) {
          throw new BusinessError('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new BusinessError('Please verify your email address', 'EMAIL_NOT_VERIFIED');
        }
        if (error.message.includes('Too many requests')) {
          throw new BusinessError('Too many login attempts. Please try again later', 'RATE_LIMITED');
        }

        throw new BusinessError('Authentication failed', 'AUTH_ERROR');
      }

      if (!data.user) {
        throw new BusinessError('Authentication failed', 'AUTH_ERROR');
      }

      // Get customer data if available
      let customerData: CustomerRow | null = null;
      try {
        const { data: customer } = await supabase.from('customers').select('*').eq('id', data.user.id).single();
        customerData = customer;
      } catch (error) {
        // Customer data is optional for auth
        logger.debug('Customer data not found for user', {
          action: 'signIn',
          userId: data.user.id,
        });
      }

      const authUser = await this.mapSupabaseUserToAuthUser(data.user, customerData || undefined);

      // Cache user data
      const cacheKey = this.getCacheKey('getCurrentUser', { userId: authUser.id });
      this.setCache(cacheKey, authUser);

      logger.info('User signed in successfully', {
        action: 'signIn',
        userId: authUser.id,
        email: authUser.email,
        role: authUser.role,
        duration: Date.now() - startTime,
      });

      return { success: true, data: authUser };
    } catch (error) {
      logger.error('Error in signIn', error as Error, {
        action: 'signIn',
        email: credentials.email,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred during sign in',
          code: 'UNKNOWN_ERROR',
        },
      };
    }
  }

  async signUp(data: RegisterData): Promise<ServiceResult<AuthUser>> {
    const startTime = Date.now();

    try {
      // Validation
      if (!data.email) {
        throw new ValidationError('Email is required', 'email', 'REQUIRED');
      }
      if (!data.password) {
        throw new ValidationError('Password is required', 'password', 'REQUIRED');
      }
      if (!data.firstName) {
        throw new ValidationError('First name is required', 'firstName', 'REQUIRED');
      }
      if (!data.lastName) {
        throw new ValidationError('Last name is required', 'lastName', 'REQUIRED');
      }
      if (!this.validateEmail(data.email)) {
        throw new ValidationError('Invalid email format', 'email', 'INVALID');
      }

      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        throw new ValidationError(passwordValidation.errors.join(', '), 'password', 'INVALID');
      }

      const supabase = await createClientServer();

      // Check if user already exists
      const { data: existingUser } = await supabase.from('customers').select('email').eq('email', data.email).single();

      if (existingUser) {
        throw new BusinessError('User with this email already exists', 'USER_EXISTS');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: UserRole.CUSTOMER,
          },
        },
      });

      if (authError) {
        logger.error('Failed to create auth user', authError, {
          action: 'signUp',
          email: data.email,
        });

        // Map Supabase auth errors to business errors
        if (authError.message.includes('User already registered')) {
          throw new BusinessError('User with this email already exists', 'USER_EXISTS');
        }
        if (authError.message.includes('Password should be')) {
          throw new BusinessError('Password does not meet requirements', 'WEAK_PASSWORD');
        }

        throw new BusinessError('Failed to create account', 'SIGNUP_ERROR');
      }

      if (!authData.user) {
        throw new BusinessError('Failed to create account', 'SIGNUP_ERROR');
      }

      // Create customer record
      const { error: customerError } = await supabase.from('customers').insert({
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
      });

      if (customerError) {
        logger.error('Failed to create customer record', customerError, {
          action: 'signUp',
          userId: authData.user.id,
        });

        // Try to clean up auth user if customer creation fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          logger.error('Failed to cleanup auth user after customer creation failure', cleanupError as Error);
        }

        throw new BusinessError('Failed to complete account setup', 'CUSTOMER_CREATE_ERROR');
      }

      const authUser = await this.mapSupabaseUserToAuthUser(authData.user, {
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        created_at: new Date().toISOString(),
      });

      logger.info('User signed up successfully', {
        action: 'signUp',
        userId: authUser.id,
        email: authUser.email,
        duration: Date.now() - startTime,
      });

      return { success: true, data: authUser };
    } catch (error) {
      logger.error('Error in signUp', error as Error, {
        action: 'signUp',
        email: data.email,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred during sign up',
          code: 'UNKNOWN_ERROR',
        },
      };
    }
  }

  async signOut(): Promise<ServiceResult<void>> {
    const startTime = Date.now();

    try {
      const supabase = await createClientServer();

      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Failed to sign out', error, { action: 'signOut' });
        throw new BusinessError('Failed to sign out', 'SIGNOUT_ERROR');
      }

      // Clear cache
      this.cache.clear();

      logger.info('User signed out successfully', {
        action: 'signOut',
        duration: Date.now() - startTime,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in signOut', error as Error, { action: 'signOut' });

      if (error instanceof BusinessError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred during sign out',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async getCurrentUser(): Promise<ServiceResult<AuthUser | null>> {
    const startTime = Date.now();

    try {
      const supabase = await createClientServer();

      const { data, error } = await supabase.auth.getUser();

      if (error) {
        logger.debug('No authenticated user found', { action: 'getCurrentUser' });
        return { success: true, data: null };
      }

      if (!data.user) {
        return { success: true, data: null };
      }

      // Check cache first
      const cacheKey = this.getCacheKey('getCurrentUser', { userId: data.user.id });
      const cached = this.getFromCache<AuthUser>(cacheKey);
      if (cached) {
        logger.debug('Current user retrieved from cache', {
          action: 'getCurrentUser',
          userId: data.user.id,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      // Get customer data
      let customerData: CustomerRow | null = null;
      try {
        const { data: customer } = await supabase.from('customers').select('*').eq('id', data.user.id).single();
        customerData = customer;
      } catch (error) {
        logger.debug('Customer data not found for user', {
          action: 'getCurrentUser',
          userId: data.user.id,
        });
      }

      const authUser = await this.mapSupabaseUserToAuthUser(data.user, customerData || undefined);

      // Cache user data
      this.setCache(cacheKey, authUser);

      logger.debug('Current user retrieved successfully', {
        action: 'getCurrentUser',
        userId: authUser.id,
        duration: Date.now() - startTime,
      });

      return { success: true, data: authUser };
    } catch (error) {
      logger.error('Error in getCurrentUser', error as Error, { action: 'getCurrentUser' });

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while getting current user',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async refreshSession(): Promise<ServiceResult<AuthUser>> {
    const startTime = Date.now();

    try {
      const supabase = await createClientServer();

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        logger.error('Failed to refresh session', error, { action: 'refreshSession' });
        throw new BusinessError('Failed to refresh session', 'SESSION_REFRESH_ERROR');
      }

      if (!data.user) {
        throw new BusinessError('No user found in refreshed session', 'SESSION_REFRESH_ERROR');
      }

      // Clear cache for this user
      this.clearUserCache(data.user.id);

      // Get updated user data
      const userResult = await this.getCurrentUser();
      if (!userResult.success || !userResult.data) {
        throw new BusinessError('Failed to get user after session refresh', 'USER_FETCH_ERROR');
      }

      logger.info('Session refreshed successfully', {
        action: 'refreshSession',
        userId: userResult.data.id,
        duration: Date.now() - startTime,
      });

      return { success: true, data: userResult.data };
    } catch (error) {
      logger.error('Error in refreshSession', error as Error, { action: 'refreshSession' });

      if (error instanceof BusinessError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while refreshing session',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async resetPassword(email: string): Promise<ServiceResult<void>> {
    const startTime = Date.now();

    try {
      if (!email) {
        throw new ValidationError('Email is required', 'email', 'REQUIRED');
      }
      if (!this.validateEmail(email)) {
        throw new ValidationError('Invalid email format', 'email', 'INVALID');
      }

      const supabase = await createClientServer();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      });

      if (error) {
        logger.error('Failed to send password reset email', error, {
          action: 'resetPassword',
          email,
        });
        throw new BusinessError('Failed to send password reset email', 'PASSWORD_RESET_ERROR');
      }

      logger.info('Password reset email sent successfully', {
        action: 'resetPassword',
        email,
        duration: Date.now() - startTime,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in resetPassword', error as Error, {
        action: 'resetPassword',
        email,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while resetting password',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async updatePassword(newPassword: string): Promise<ServiceResult<void>> {
    const startTime = Date.now();

    try {
      if (!newPassword) {
        throw new ValidationError('New password is required', 'newPassword', 'REQUIRED');
      }

      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new ValidationError(passwordValidation.errors.join(', '), 'newPassword', 'INVALID');
      }

      const supabase = await createClientServer();

      // Verify user is authenticated
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new BusinessError('User not authenticated', 'NOT_AUTHENTICATED');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        logger.error('Failed to update password', error, {
          action: 'updatePassword',
          userId: userData.user.id,
        });
        throw new BusinessError('Failed to update password', 'PASSWORD_UPDATE_ERROR');
      }

      logger.info('Password updated successfully', {
        action: 'updatePassword',
        userId: userData.user.id,
        duration: Date.now() - startTime,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in updatePassword', error as Error, { action: 'updatePassword' });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while updating password',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async searchUsers(filters?: UserFilters): Promise<ServiceResult<User[]>> {
    const startTime = Date.now();

    try {
      const supabase = await createClientServer('service_role');

      let query = supabase.from('customers').select('*');

      // Apply filters
      if (filters?.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      const dbSortBy = sortBy === 'firstName' ? 'first_name' : sortBy === 'lastName' ? 'last_name' : sortBy;
      query = query.order(dbSortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to search users', error, {
          action: 'searchUsers',
          filters,
        });
        throw new BusinessError('Failed to search users', 'USERS_SEARCH_ERROR');
      }

      const users: User[] = (data || []).map(customer => ({
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        role: UserRole.CUSTOMER,
        isActive: true,
        emailVerified: true,
        createdAt: new Date(customer.created_at),
        updatedAt: new Date(customer.created_at),
      }));

      logger.info('Users search completed', {
        action: 'searchUsers',
        count: users.length,
        duration: Date.now() - startTime,
      });

      return { success: true, data: users };
    } catch (error) {
      logger.error('Error in searchUsers', error as Error, {
        action: 'searchUsers',
        filters,
      });

      if (error instanceof BusinessError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while searching users',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  // Permission and role management methods
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.success || !userResult.data) {
        return false;
      }

      const user = userResult.data;

      // Admin has all permissions
      if (user.role === UserRole.ADMIN) {
        return true;
      }

      // Define role-based permissions
      const rolePermissions: Record<UserRole, string[]> = {
        [UserRole.ADMIN]: ['*'], // All permissions
        [UserRole.MODERATOR]: ['cart:read', 'order:read', 'order:update', 'profile:read', 'user:read'], // Moderator permissions
        [UserRole.CUSTOMER]: ['cart:read', 'cart:write', 'order:read', 'order:create', 'profile:read', 'profile:write'],
      };

      const userPermissions = rolePermissions[user.role] || [];
      return userPermissions.includes('*') || userPermissions.includes(permission);
    } catch (error) {
      logger.error('Error checking user permission', error as Error, {
        action: 'hasPermission',
        userId,
        permission,
      });
      return false;
    }
  }

  async requireAuth(): Promise<ServiceResult<AuthUser>> {
    const userResult = await this.getCurrentUser();
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: {
          message: 'Authentication required',
          code: 'NOT_AUTHENTICATED',

        },
      };
    }
    return {
      success: true,
      data: userResult.data,
    };
  }

  async requirePermission(permission: string): Promise<ServiceResult<AuthUser>> {
    const userResult = await this.requireAuth();
    if (!userResult.success) {
      return userResult;
    }

    const hasPermission = await this.hasPermission(userResult.data!.id, permission);
    if (!hasPermission) {
      return {
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',

        },
      };
    }

    return userResult;
  }

  // Cache management methods
  async clearCache(key?: string): Promise<ServiceResult<void>> {
    try {
      if (key) {
        this.cache.delete(key);
        logger.info('Auth service cache key cleared', { action: 'clearCache', key });
      } else {
        this.cache.clear();
        logger.info('Auth service cache cleared', { action: 'clearCache' });
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to clear auth cache', error as Error, { action: 'clearCache', key });
      return {
        success: false,
        error: {
          message: 'Failed to clear cache',
          code: 'CACHE_CLEAR_ERROR',
        },
      };
    }
  }

  async refreshCache(key?: string): Promise<ServiceResult<void>> {
    try {
      if (key) {
        // Refresh specific cache key by removing it (will be refetched on next access)
        this.cache.delete(key);
        logger.info('Auth service cache key refreshed', { action: 'refreshCache', key });
      } else {
        // Refresh all cache by clearing it
        this.cache.clear();
        logger.info('Auth service cache refreshed', { action: 'refreshCache' });
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to refresh auth cache', error as Error, { action: 'refreshCache', key });
      return {
        success: false,
        error: {
          message: 'Failed to refresh cache',
          code: 'CACHE_REFRESH_ERROR',
        },
      };
    }
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const authService = new AuthServiceImpl();
