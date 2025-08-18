import { ContactForm, QuickContactForm } from '@/components/forms/contact-form';
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

describe('Contact Form Components', () => {
  describe('ContactForm', () => {
    it('renders all form fields correctly', () => {
      render(<ContactForm onSubmit={jest.fn()} />);

      // Check for form fields
      expect(screen.getByLabelText(/الاسم/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/الموضوع/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/الرسالة/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /إرسال/i })).toBeInTheDocument();
    });

    it('submits the form with valid data', async () => {
      const handleSubmit = jest.fn();
      render(<ContactForm onSubmit={handleSubmit} />);

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/الاسم/i), { target: { value: 'محمد أحمد' } });
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/الموضوع/i), { target: { value: 'استفسار' } });
      fireEvent.change(screen.getByLabelText(/الرسالة/i), { target: { value: 'هذه رسالة اختبار' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /إرسال/i }));

      // Wait for the form submission
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'محمد أحمد',
            email: 'test@example.com',
            subject: 'استفسار',
            message: 'هذه رسالة اختبار',
          })
        );
      });
    });

    it('validates required fields', async () => {
      const handleSubmit = jest.fn();
      render(<ContactForm onSubmit={handleSubmit} />);

      // Submit the form without filling any fields
      fireEvent.click(screen.getByRole('button', { name: /إرسال/i }));

      // Wait for validation errors
      await waitFor(() => {
        expect(handleSubmit).not.toHaveBeenCalled();
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      });
    });

    it('is accessible', async () => {
      const { container } = render(<ContactForm onSubmit={jest.fn()} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('QuickContactForm', () => {
    it('renders with placeholder text', () => {
      render(<QuickContactForm onSubmit={jest.fn()} placeholder='اكتب رسالتك هنا...' />);

      expect(screen.getByPlaceholderText('اكتب رسالتك هنا...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /إرسال/i })).toBeInTheDocument();
    });

    it('submits the form with valid message', async () => {
      const handleSubmit = jest.fn();
      render(<QuickContactForm onSubmit={handleSubmit} />);

      // Fill out the message
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'هذه رسالة اختبار سريعة' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /إرسال/i }));

      // Wait for the form submission
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'هذه رسالة اختبار سريعة',
          })
        );
      });
    });

    it('validates required message field', async () => {
      const handleSubmit = jest.fn();
      render(<QuickContactForm onSubmit={handleSubmit} />);

      // Submit the form without filling the message
      fireEvent.click(screen.getByRole('button', { name: /إرسال/i }));

      // Wait for validation errors
      await waitFor(() => {
        expect(handleSubmit).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('is accessible', async () => {
      const { container } = render(<QuickContactForm onSubmit={jest.fn()} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
