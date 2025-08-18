import { CompactLoginForm, LoginForm } from '@/components/forms/login-form';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { setupComponentTest } from '../../utils/test-env-setup';

// Setup the test environment
setupComponentTest();

// Mock the error handling hook
jest.mock('@/hooks/use-error-handling', () => ({
  useErrorHandling: () => ({
    error: null,
    handleError: jest.fn(),
    clearError: jest.fn(),
  }),
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('Login Form Components', () => {
  describe('LoginForm', () => {
    it('renders all form fields correctly', () => {
      render(<LoginForm onSubmit={jest.fn()} onForgotPassword={jest.fn()} onRegister={jest.fn()} />);

      // Check for form fields
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument();
      expect(screen.getByText(/نسيت كلمة المرور/i)).toBeInTheDocument();
      expect(screen.getByText(/ليس لديك حساب/i)).toBeInTheDocument();
    });

    it('submits the form with valid credentials', async () => {
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} onForgotPassword={jest.fn()} onRegister={jest.fn()} />);

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), { target: { value: 'Password123!' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /تسجيل الدخول/i }));

      // Wait for the form submission
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            password: 'Password123!',
          })
        );
      });
    });

    it('validates required fields', async () => {
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} onForgotPassword={jest.fn()} onRegister={jest.fn()} />);

      // Submit the form without filling any fields
      fireEvent.click(screen.getByRole('button', { name: /تسجيل الدخول/i }));

      // Wait for validation errors
      await waitFor(() => {
        expect(handleSubmit).not.toHaveBeenCalled();
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      });
    });

    it('calls onForgotPassword when forgot password link is clicked', () => {
      const handleForgotPassword = jest.fn();
      render(<LoginForm onSubmit={jest.fn()} onForgotPassword={handleForgotPassword} onRegister={jest.fn()} />);

      fireEvent.click(screen.getByText(/نسيت كلمة المرور/i));
      expect(handleForgotPassword).toHaveBeenCalledTimes(1);
    });

    it('calls onRegister when register link is clicked', () => {
      const handleRegister = jest.fn();
      render(<LoginForm onSubmit={jest.fn()} onForgotPassword={jest.fn()} onRegister={handleRegister} />);

      fireEvent.click(screen.getByText(/إنشاء حساب/i));
      expect(handleRegister).toHaveBeenCalledTimes(1);
    });

    it('is accessible', async () => {
      const { container } = render(
        <LoginForm onSubmit={jest.fn()} onForgotPassword={jest.fn()} onRegister={jest.fn()} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CompactLoginForm', () => {
    it('renders all form fields correctly', () => {
      render(<CompactLoginForm onSubmit={jest.fn()} onCancel={jest.fn()} />);

      // Check for form fields
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /إلغاء/i })).toBeInTheDocument();
    });

    it('submits the form with valid credentials', async () => {
      const handleSubmit = jest.fn();
      render(<CompactLoginForm onSubmit={handleSubmit} onCancel={jest.fn()} />);

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), { target: { value: 'Password123!' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /تسجيل الدخول/i }));

      // Wait for the form submission
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            password: 'Password123!',
          })
        );
      });
    });

    it('calls onCancel when cancel button is clicked', () => {
      const handleCancel = jest.fn();
      render(<CompactLoginForm onSubmit={jest.fn()} onCancel={handleCancel} />);

      fireEvent.click(screen.getByRole('button', { name: /إلغاء/i }));
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('is accessible', async () => {
      const { container } = render(<CompactLoginForm onSubmit={jest.fn()} onCancel={jest.fn()} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
