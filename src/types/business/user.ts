import { BaseEntity } from '../common';
import { Tables } from '../database';
import { UserRole } from '../enums';

// Base Supabase types
export type CustomerRow = Tables<'customers'>;
export type ProfileRow = Tables<'profiles'>;
export type UserRoleRow = Tables<'user_roles'>;

// Extended business types
export interface UserPreferences {
  language: 'ar' | 'en';
  currency: 'SAR' | 'USD';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

export interface Address extends BaseEntity {
  customerId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
  label?: string;
}

export interface UserProfile extends BaseEntity {
  userId: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female';
  preferences: UserPreferences;
  addresses: Address[];
  avatarUrl?: string;
  website?: string;
  bio?: string;
}

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profile?: UserProfile;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  preferences?: Partial<UserPreferences>;
  avatarUrl?: string;
  website?: string;
  bio?: string;
}

// User filters and search
export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}
