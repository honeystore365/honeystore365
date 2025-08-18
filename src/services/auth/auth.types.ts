// Auth service specific types
import { AuthUser, LoginCredentials, RegisterData, User } from '@/types/business';
import { ServiceResult } from '@/types/common';
import { CacheableService, UserSearchFilters } from '@/types/services';

export interface AuthService extends CacheableService {
  signIn(credentials: LoginCredentials): Promise<ServiceResult<AuthUser>>;
  signUp(data: RegisterData): Promise<ServiceResult<AuthUser>>;
  signOut(): Promise<ServiceResult<void>>;
  getCurrentUser(): Promise<ServiceResult<AuthUser | null>>;
  refreshSession(): Promise<ServiceResult<AuthUser>>;
  resetPassword(email: string): Promise<ServiceResult<void>>;
  updatePassword(newPassword: string): Promise<ServiceResult<void>>;
  searchUsers(filters?: UserSearchFilters): Promise<ServiceResult<User[]>>;
}

export interface SessionData {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
