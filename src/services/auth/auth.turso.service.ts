import { cookies } from 'next/headers';
import {
  signInWithPassword,
  signUp as tursoSignUp,
  validateSession,
  signOut as tursoSignOut,
  getCustomerById,
  TursoUser,
} from '@/lib/turso/auth';
import { db } from '@/lib/turso/client';
import { BusinessError, ValidationError } from '@/lib/errors/custom-errors';
import { logger } from '@/lib/logger';
import type { AuthService, SessionData } from './auth.types';
import type { AuthUser, LoginCredentials, RegisterData } from '@/types/business';
import type { ServiceResult } from '@/types/common';

const SESSION_COOKIE = 'honey_session';

function mapTursoUserToAuthUser(user: TursoUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role as any,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: null,
  };
}

export class TursoAuthService implements AuthService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000;

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
      const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
        key.includes(userId)
      );
      keysToDelete.forEach((key) => this.cache.delete(key));
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
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
    if (!/\d/.test(password)) errors.push('Password must contain a number');
    return { isValid: errors.length === 0, errors };
  }

  private async getSessionToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    return sessionCookie?.value || null;
  }

  private async setSessionCookie(token: string, expiresAt: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(expiresAt),
      path: '/',
    });
  }

  private async clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  }

  async signIn(credentials: LoginCredentials): Promise<ServiceResult<AuthUser>> {
    try {
      if (!credentials.email) {
        throw new ValidationError('Email is required', 'email', 'REQUIRED');
      }
      if (!credentials.password) {
        throw new ValidationError('Password is required', 'password', 'REQUIRED');
      }
      if (!this.validateEmail(credentials.email)) {
        throw new ValidationError('Invalid email format', 'email', 'INVALID');
      }

      const result = await signInWithPassword(credentials.email, credentials.password);

      if (result.error || !result.user || !result.session) {
        throw new BusinessError(result.error || 'Authentication failed', 'AUTH_ERROR');
      }

      await this.setSessionCookie(result.session.token, result.session.expiresAt);

      const authUser = mapTursoUserToAuthUser(result.user);
      this.setCache(this.getCacheKey('getCurrentUser', { userId: authUser.id }), authUser);

      logger.info('User signed in', { action: 'signIn', userId: authUser.id, email: authUser.email });

      return { success: true, data: authUser };
    } catch (error) {
      logger.error('Error in signIn', error as Error, { action: 'signIn' });
      if (error instanceof BusinessError || error instanceof ValidationError) {
        return { success: false, error: { message: error.message, code: error.code } };
      }
      return { success: false, error: { message: 'Authentication failed', code: 'AUTH_ERROR' } };
    }
  }

  async signUp(data: RegisterData): Promise<ServiceResult<AuthUser>> {
    try {
      if (!data.email) throw new ValidationError('Email is required', 'email', 'REQUIRED');
      if (!data.password) throw new ValidationError('Password is required', 'password', 'REQUIRED');
      if (!data.firstName) throw new ValidationError('First name is required', 'firstName', 'REQUIRED');
      if (!data.lastName) throw new ValidationError('Last name is required', 'lastName', 'REQUIRED');
      if (!this.validateEmail(data.email)) {
        throw new ValidationError('Invalid email format', 'email', 'INVALID');
      }
      const pwValidation = this.validatePassword(data.password);
      if (!pwValidation.isValid) {
        throw new ValidationError(pwValidation.errors[0], 'password', 'INVALID');
      }

      const result = await tursoSignUp(data.email, data.password, data.firstName, data.lastName, data.phone);

      if (result.error || !result.user || !result.session) {
        throw new BusinessError(result.error || 'Registration failed', 'REGISTRATION_ERROR');
      }

      await this.setSessionCookie(result.session.token, result.session.expiresAt);

      const authUser = mapTursoUserToAuthUser(result.user);
      return { success: true, data: authUser };
    } catch (error) {
      logger.error('Error in signUp', error as Error, { action: 'signUp' });
      if (error instanceof BusinessError || error instanceof ValidationError) {
        return { success: false, error: { message: error.message, code: error.code } };
      }
      return { success: false, error: { message: 'Registration failed', code: 'REGISTRATION_ERROR' } };
    }
  }

  async signOut(): Promise<ServiceResult<void>> {
    try {
      const token = await this.getSessionToken();
      if (token) {
        await tursoSignOut(token);
        await this.clearSessionCookie();
      }
      this.clearUserCache();
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Error in signOut', error as Error);
      return { success: false, error: { message: 'Sign out failed', code: 'SIGNOUT_ERROR' } };
    }
  }

  async getCurrentUser(): Promise<ServiceResult<AuthUser | null>> {
    try {
      const token = await this.getSessionToken();
      if (!token) {
        return { success: true, data: null };
      }

      const user = await validateSession(token);
      if (!user) {
        await this.clearSessionCookie();
        return { success: true, data: null };
      }

      return { success: true, data: mapTursoUserToAuthUser(user) };
    } catch (error) {
      logger.error('Error in getCurrentUser', error as Error);
      return { success: false, error: { message: 'Failed to get current user', code: 'UNKNOWN' } };
    }
  }

  async refreshSession(): Promise<ServiceResult<AuthUser>> {
    return this.getCurrentUser();
  }

  async resetPassword(email: string): Promise<ServiceResult<void>> {
    try {
      if (!email) throw new ValidationError('Email is required', 'email', 'REQUIRED');
      
      const result = await db.execute({
        sql: 'SELECT id FROM customers WHERE email = ?',
        args: [email],
      });

      if (!result.rows || result.rows.length === 0) {
        return { success: true, data: undefined };
      }

      const customerId = result.rows[0].id as string;
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { createPasswordResetCode } = await import('@/lib/turso/auth');
      createPasswordResetCode(customerId, code);

      logger.info('Password reset code created', { action: 'resetPassword', email });
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Error in resetPassword', error as Error);
      return { success: false, error: { message: 'Failed to reset password', code: 'UNKNOWN' } };
    }
  }

  async updatePassword(newPassword: string): Promise<ServiceResult<void>> {
    try {
      const token = await this.getSessionToken();
      if (!token) throw new BusinessError('Not authenticated', 'NOT_AUTHENTICATED');

      const user = await validateSession(token);
      if (!user) throw new BusinessError('Session expired', 'SESSION_EXPIRED');

      const pwValidation = this.validatePassword(newPassword);
      if (!pwValidation.isValid) {
        throw new ValidationError(pwValidation.errors[0], 'password', 'INVALID');
      }

      const { resetPassword } = await import('@/lib/turso/auth');
      await resetPassword(user.id, newPassword);

      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Error in updatePassword', error as Error);
      if (error instanceof BusinessError || error instanceof ValidationError) {
        return { success: false, error: { message: error.message, code: error.code } };
      }
      return { success: false, error: { message: 'Failed to update password', code: 'UNKNOWN' } };
    }
  }

  async searchUsers(_filters?: any): Promise<ServiceResult<any[]>> {
    return { success: true, data: [] };
  }

  clearCache(): void {
    this.clearUserCache();
  }
}

export const tursoAuthService = new TursoAuthService();
