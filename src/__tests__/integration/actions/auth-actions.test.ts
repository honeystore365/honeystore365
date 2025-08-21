import * as authActions from '@/actions/authActions';
import { setupIntegrationTest } from '../../utils/test-env-setup';

// Mock the createClientServer function
jest.mock('@/lib/supabaseClientServer', () => ({
  createClientServer: jest.fn().mockImplementation(() => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            user_metadata: { role: 'customer' },
          },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
          },
        },
        error: null,
      }),
    },
  })),
}));

// Mock the security module
jest.mock('@/lib/security', () => {
  const original = jest.requireActual('@/lib/security');
  return {
    ...original,
    createPublicAction: (name: string, schema?: any) => {
      return (handler: any) => {
        return async (input: any) => {
          // Simplified mock that bypasses validation
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

// Setup the test environment
setupIntegrationTest();

describe('Auth Actions Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in a user successfully', async () => {
      // Arrange
      const input = { email: 'test@example.com', password: 'password123' };
      const redirectMock = jest.requireMock('next/navigation').redirect;

      // Act
      await authActions.signIn(input);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith('/profile');
    });

    it('should redirect admin users to admin dashboard', async () => {
      // Arrange
      const input = { email: 'admin@example.com', password: 'admin123' };
      const redirectMock = jest.requireMock('next/navigation').redirect;
      
      // Mock admin user
      jest.requireMock('@/lib/supabaseClientServer').createClientServer.mockImplementation(() => ({
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'admin-1',
                email: 'admin@example.com',
                user_metadata: { role: 'admin' },
              },
              session: {
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
              },
            },
            error: null,
          }),
        },
      }));

      // Act
      await authActions.signIn(input);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith('/admin');
    });

    it('should handle invalid credentials', async () => {
      // Arrange
      const input = { email: 'wrong@example.com', password: 'wrongpass' };
      const redirectMock = jest.requireMock('next/navigation').redirect;
      
      // Mock authentication error
      jest.requireMock('@/lib/supabaseClientServer').createClientServer.mockImplementation(() => ({
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
          }),
        },
      }));

      // Act
      await authActions.signIn(input);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith(
        '/auth/login?message=Invalid%20email%20or%20password'
      );
    });
  });

  describe('signInFormData', () => {
    it('should handle form data correctly', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      // Mock the signIn function
      const signInSpy = jest.spyOn(authActions, 'signIn')
        .mockImplementation(async () => {});

      // Act
      await authActions.signInFormData(formData);

      // Assert
      expect(signInSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});