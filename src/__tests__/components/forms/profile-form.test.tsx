import { ProfileForm, QuickProfileForm } from '@/components/forms/profile-form';
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

describe('Profile Form Components', () => {
  const mockInitialData = {
    firstName: 'محمد',
    lastName: 'أحمد',
    email: 'test@example.com',
    phoneNumber: '0501234567',
  };

  describe('ProfileForm', () => {
    it('renders all form fields correctly', () => {
      render(<ProfileForm onSubmit={jest.fn()} />);

      // Check for form fields
      expect(screen.getByLabelText(/الاسم الأول/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/اسم العائلة/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/رقم الهاتف/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /حفظ التغييرات/i })).toBeInTheDocument();
    });

    it('pre-fills form with initial data', () => {
      render(<ProfileForm initialData={mockInitialData} onSubmit={jest.fn()} />);

      expect(screen.getByLabelText(/الاسم الأول/i)).toHaveValue('محمد');
      expect(screen.getByLabelText(/اسم العائلة/i)).toHaveValue('أحمد');
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toHaveValue('test@example.com');
      expect(screen.getByLabelText(/رقم الهاتف/i)).toHaveValue('0501234567');
    });

    it('submits the form with valid data', async () => {
      const handleSubmit = jest.fn();
      render(<ProfileForm initialData={mockInitialData} onSubmit={handleSubmit} />);

      // Update some fields
      fireEvent.change(screen.getByLabelText(/الاسم الأول/i), { target: { value: 'أحمد' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /حفظ التغييرات/i }));

      // Wait for the form submission
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'أحمد',
            lastName: 'أحمد',
            email: 'test@example.com',
            phoneNumber: '0501234567',
          })
        );
      });
    });

    it('validates required fields', async () => {
      const handleSubmit = jest.fn();
      render(<ProfileForm onSubmit={handleSubmit} />);

      // Submit the form without filling any fields
      fireEvent.click(screen.getByRole('button', { name: /حفظ التغييرات/i }));

      // Wait for validation errors
      await waitFor(() => {
        expect(handleSubmit).not.toHaveBeenCalled();
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      });
    });

    it('is accessible', async () => {
      const { container } = render(<ProfileForm onSubmit={jest.fn()} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('QuickProfileForm', () => {
    it('renders all form fields correctly', () => {
      render(<QuickProfileForm onSubmit={jest.fn()} onCancel={jest.fn()} />);

      // Check for form fields
      expect(screen.getByLabelText(/الاسم الأول/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/اسم العائلة/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/رقم الهاتف/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /حفظ/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /إلغاء/i })).toBeInTheDocument();
    });

    it('pre-fills form with initial data', () => {
      render(<QuickProfileForm initialData={mockInitialData} onSubmit={jest.fn()} onCancel={jest.fn()} />);

      expect(screen.getByLabelText(/الاسم الأول/i)).toHaveValue('محمد');
      expect(screen.getByLabelText(/اسم العائلة/i)).toHaveValue('أحمد');
      expect(screen.getByLabelText(/رقم الهاتف/i)).toHaveValue('0501234567');
    });

    it('submits the form with valid data', async () => {
      const handleSubmit = jest.fn();
      render(<QuickProfileForm initialData={mockInitialData} onSubmit={handleSubmit} onCancel={jest.fn()} />);

      // Update some fields
      fireEvent.change(screen.getByLabelText(/الاسم الأول/i), { target: { value: 'أحمد' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /حفظ/i }));

      // Wait for the form submission
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'أحمد',
            lastName: 'أحمد',
            phoneNumber: '0501234567',
          })
        );
      });
    });

    it('calls onCancel when cancel button is clicked', () => {
      const handleCancel = jest.fn();
      render(<QuickProfileForm onSubmit={jest.fn()} onCancel={handleCancel} />);

      fireEvent.click(screen.getByRole('button', { name: /إلغاء/i }));
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('is accessible', async () => {
      const { container } = render(<QuickProfileForm onSubmit={jest.fn()} onCancel={jest.fn()} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
