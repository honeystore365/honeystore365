import * as authActions from '@/actions/authActions';
// Mock the createClientServer function
jest.mock('@/lib/supabase/server', () => ({
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

describe('Auth Actions Integration Tests', () => {
  let createClientServerMock: jest.Mock;
  let redirectMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock implementations
    createClientServerMock = jest.requireMock('@/lib/supabase/server').createClientServer;
    redirectMock = jest.requireMock('next/navigation').redirect;
  });

  const mockSupabaseSignIn = (user: any, error: any) => {
    createClientServerMock.mockImplementation(() => ({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user, session: user ? { access_token: 'mock-token' } : null },
          error,
        }),
        getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
        getSession: jest.fn().mockResolvedValue({ data: { session: user ? { access_token: 'mock-token' } : null }, error: null }),
      },
    }));
  };

  describe('signIn', () => {
    it('should sign in a user successfully and redirect to profile', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: { role: 'customer' },
      };
      mockSupabaseSignIn(mockUser, null);

      // Act
      await authActions.signIn(formData);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith('/profile');
    });

    it('should redirect admin users to admin dashboard', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'admin@example.com');
      formData.append('password', 'admin123');
      
      const mockAdminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        user_metadata: { role: 'admin' },
      };
      mockSupabaseSignIn(mockAdminUser, null);

      // Act
      await authActions.signIn(formData);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith('/admin');
    });

    it('should handle invalid credentials and redirect to login', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'wrong@example.com');
      formData.append('password', 'wrongpass');
      
      mockSupabaseSignIn(null, { message: 'Invalid login credentials' });

      // Act
      await authActions.signIn(formData);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith(
        '/auth/login?message=Could not authenticate user'
      );
    });
  });
});