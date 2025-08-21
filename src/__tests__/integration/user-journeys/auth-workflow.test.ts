import * as authActions from '@/actions/authActions';
import { createMockUser } from '../../utils/test-utils';

// Mock the createClientServer function
jest.mock('@/lib/supabase/server', () => ({
  createClientServer: jest.fn(),
}));

// Mock the security module
jest.mock('@/lib/security', () => {
  const original = jest.requireActual('@/lib/security');
  return {
    ...original,
    createPublicAction: (name: string, schema?: any) => {
      return (handler: any) => {
        return async (input: any) => {
          return handler(input, { actionName: name, timestamp: new Date() });
        };
      };
    },
  };
});

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Authentication Workflow Integration Tests', () => {
  let mockSupabase: any;
  let redirectMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh mock for each test
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
      },
    };
    
    (require('@/lib/supabaseClientServer').createClientServer as jest.Mock)
      .mockResolvedValue(mockSupabase);

    redirectMock = require('next/navigation').redirect as jest.Mock;
  });

  describe('User Authentication Scenarios', () => {
    it('should handle customer login workflow', async () => {
      // Arrange
      const customerUser = createMockUser({ role: 'customer' });
      const loginInput = {
        email: customerUser.email,
        password: 'password123',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: customerUser,
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
          },
        },
        error: null,
      });

      // Act
      await authActions.signIn(loginInput);

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: customerUser.email,
        password: 'password123',
      });
      expect(redirectMock).toHaveBeenCalledWith('/profile');
    });

    it('should handle admin login workflow', async () => {
      // Arrange
      const adminUser = createMockUser({ 
        role: 'admin',
        email: 'admin@example.com',
      });
      const loginInput = {
        email: adminUser.email,
        password: 'admin123',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            ...adminUser,
            user_metadata: { role: 'admin' },
          },
          session: {
            access_token: 'mock-admin-token',
            refresh_token: 'mock-admin-refresh',
          },
        },
        error: null,
      });

      // Act
      await authActions.signIn(loginInput);

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: adminUser.email,
        password: 'admin123',
      });
      expect(redirectMock).toHaveBeenCalledWith('/admin');
    });

    it('should handle moderator login workflow', async () => {
      // Arrange
      const moderatorUser = createMockUser({ 
        role: 'moderator',
        email: 'moderator@example.com',
      });
      const loginInput = {
        email: moderatorUser.email,
        password: 'mod123',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            ...moderatorUser,
            user_metadata: { role: 'moderator' },
          },
          session: {
            access_token: 'mock-mod-token',
            refresh_token: 'mock-mod-refresh',
          },
        },
        error: null,
      });

      // Act
      await authActions.signIn(loginInput);

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: moderatorUser.email,
        password: 'mod123',
      });
      expect(redirectMock).toHaveBeenCalledWith('/admin'); // Moderators also go to admin
    });

    it('should handle invalid credentials', async () => {
      // Arrange
      const invalidInput = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      // Act
      await authActions.signIn(invalidInput);

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });
      expect(redirectMock).toHaveBeenCalledWith(
        '/auth/login?message=Invalid%20email%20or%20password'
      );
    });

    it('should handle network errors during login', async () => {
      // Arrange
      const loginInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Network error' },
      });

      // Act
      await authActions.signIn(loginInput);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith(
        '/auth/login?message=Network%20error'
      );
    });

    it('should handle account locked scenario', async () => {
      // Arrange
      const loginInput = {
        email: 'locked@example.com',
        password: 'password123',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Account temporarily locked' },
      });

      // Act
      await authActions.signIn(loginInput);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith(
        '/auth/login?message=Account%20temporarily%20locked'
      );
    });

    it('should handle email not confirmed scenario', async () => {
      // Arrange
      const loginInput = {
        email: 'unconfirmed@example.com',
        password: 'password123',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      });

      // Act
      await authActions.signIn(loginInput);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith(
        '/auth/login?message=Email%20not%20confirmed'
      );
    });
  });

  describe('Form Data Authentication', () => {
    it('should handle FormData login correctly', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const customerUser = createMockUser();
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: customerUser,
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
          },
        },
        error: null,
      });

      // Act
      await authActions.signInFormData(formData);

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(redirectMock).toHaveBeenCalledWith('/profile');
    });

    it('should handle missing form fields', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      // Missing password field

      // Act
      await authActions.signInFormData(formData);

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: null, // FormData.get returns null for missing fields
      });
    });

    it('should handle empty form data', async () => {
      // Arrange
      const formData = new FormData();

      // Act
      await authActions.signInFormData(formData);

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: null,
        password: null,
      });
    });
  });

  describe('Role-Based Redirection', () => {
    it('should redirect different user roles to appropriate pages', async () => {
      const testCases = [
        {
          role: 'customer',
          expectedRedirect: '/profile',
        },
        {
          role: 'admin',
          expectedRedirect: '/admin',
        },
        {
          role: 'moderator',
          expectedRedirect: '/admin',
        },
        {
          role: 'super_admin',
          expectedRedirect: '/admin',
        },
      ];

      for (const testCase of testCases) {
        // Arrange
        const user = createMockUser({ role: testCase.role });
        const loginInput = {
          email: user.email,
          password: 'password123',
        };

        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: {
            user: {
              ...user,
              user_metadata: { role: testCase.role },
            },
            session: {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh',
            },
          },
          error: null,
        });

        // Act
        await authActions.signIn(loginInput);

        // Assert
        expect(redirectMock).toHaveBeenCalledWith(testCase.expectedRedirect);

        // Reset mocks for next iteration
        jest.clearAllMocks();
        (require('@/lib/supabaseClientServer').createClientServer as jest.Mock)
          .mockResolvedValue(mockSupabase);
      }
    });

    it('should default to profile page for unknown roles', async () => {
      // Arrange
      const user = createMockUser();
      const loginInput = {
        email: user.email,
        password: 'password123',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            ...user,
            user_metadata: { role: 'unknown_role' },
          },
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
          },
        },
        error: null,
      });

      // Act
      await authActions.signIn(loginInput);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith('/profile');
    });

    it('should handle user without role metadata', async () => {
      // Arrange
      const user = createMockUser();
      const loginInput = {
        email: user.email,
        password: 'password123',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            ...user,
            user_metadata: {}, // No role specified
          },
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
          },
        },
        error: null,
      });

      // Act
      await authActions.signIn(loginInput);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith('/profile');
    });
  });
});