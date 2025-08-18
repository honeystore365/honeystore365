import { FormInput } from '@/components/forms/form-fields';
import { CancelButton, FormActions, FormProvider, FormSection, SubmitButton } from '@/components/forms/form-provider';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { z } from 'zod';
import { setupComponentTest } from '../../utils/test-env-setup';

// Setup the test environment
setupComponentTest();

describe('Form Provider Components', () => {
  describe('FormProvider', () => {
    const schema = z.object({
      name: z.string().min(3, 'الاسم يجب أن يحتوي على 3 أحرف على الأقل'),
      email: z.string().email('البريد الإلكتروني غير صحيح'),
    });

    it('renders form with children', () => {
      render(
        <FormProvider schema={schema} onSubmit={jest.fn()}>
          <div data-testid='form-content'>محتوى النموذج</div>
        </FormProvider>
      );

      expect(screen.getByTestId('form-content')).toBeInTheDocument();
    });

    it('handles form submission with validation', async () => {
      const handleSubmit = jest.fn();
      const { container } = render(
        <FormProvider schema={schema} onSubmit={handleSubmit}>
          <FormInput name='name' label='الاسم' />
          <FormInput name='email' label='البريد الإلكتروني' />
          <button type='submit'>إرسال</button>
        </FormProvider>
      );

      // Submit the form with invalid data
      fireEvent.click(screen.getByText('إرسال'));

      // Wait for validation to complete
      await waitFor(() => {
        expect(handleSubmit).not.toHaveBeenCalled();
      });

      // Form should show validation errors
      expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
    });

    it('is accessible', async () => {
      const { container } = render(
        <FormProvider schema={schema} onSubmit={jest.fn()}>
          <FormInput name='name' label='الاسم' />
          <FormInput name='email' label='البريد الإلكتروني' />
          <button type='submit'>إرسال</button>
        </FormProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('FormSection', () => {
    it('renders with title and description', () => {
      render(
        <FormSection title='معلومات الحساب' description='أدخل معلومات حسابك'>
          <div data-testid='section-content'>محتوى القسم</div>
        </FormSection>
      );

      expect(screen.getByText('معلومات الحساب')).toBeInTheDocument();
      expect(screen.getByText('أدخل معلومات حسابك')).toBeInTheDocument();
      expect(screen.getByTestId('section-content')).toBeInTheDocument();
    });

    it('is accessible', async () => {
      const { container } = render(
        <FormSection title='معلومات الحساب' description='أدخل معلومات حسابك'>
          <div>محتوى القسم</div>
        </FormSection>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('FormActions', () => {
    it('renders with children and correct alignment', () => {
      render(
        <FormActions align='center'>
          <button>حفظ</button>
          <button>إلغاء</button>
        </FormActions>
      );

      const actionsContainer = screen.getByText('حفظ').parentElement;
      expect(actionsContainer).toHaveClass('justify-center');
      expect(screen.getByText('حفظ')).toBeInTheDocument();
      expect(screen.getByText('إلغاء')).toBeInTheDocument();
    });

    it('is accessible', async () => {
      const { container } = render(
        <FormActions>
          <button>حفظ</button>
          <button>إلغاء</button>
        </FormActions>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('SubmitButton', () => {
    // Mock the form context for SubmitButton
    jest.mock('@/components/forms/form-provider', () => {
      const originalModule = jest.requireActual('@/components/forms/form-provider');

      return {
        ...originalModule,
        useFormValidation: () => ({
          formState: {
            isSubmitting: false,
            isValid: true,
            errors: {},
          },
        }),
      };
    });

    it('renders with children', () => {
      render(
        <FormProvider schema={z.object({})} onSubmit={jest.fn()}>
          <SubmitButton>حفظ التغييرات</SubmitButton>
        </FormProvider>
      );

      expect(screen.getByText('حفظ التغييرات')).toBeInTheDocument();
    });

    it('shows loading state when submitting', () => {
      // Override the mock for this specific test
      jest.spyOn(require('@/components/forms/form-provider'), 'useFormValidation').mockImplementation(() => ({
        formState: {
          isSubmitting: true,
          isValid: true,
          errors: {},
        },
      }));

      render(
        <FormProvider schema={z.object({})} onSubmit={jest.fn()}>
          <SubmitButton loadingText='جاري الحفظ...'>حفظ التغييرات</SubmitButton>
        </FormProvider>
      );

      expect(screen.getByText('جاري الحفظ...')).toBeInTheDocument();
    });

    it('is accessible', async () => {
      const { container } = render(
        <FormProvider schema={z.object({})} onSubmit={jest.fn()}>
          <SubmitButton>حفظ التغييرات</SubmitButton>
        </FormProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CancelButton', () => {
    it('renders with children and calls onClick handler', () => {
      const handleClick = jest.fn();
      render(<CancelButton onClick={handleClick}>إلغاء</CancelButton>);

      const button = screen.getByText('إلغاء');
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is accessible', async () => {
      const { container } = render(<CancelButton onClick={jest.fn()}>إلغاء</CancelButton>);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
