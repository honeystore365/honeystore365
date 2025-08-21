import {
  FormCheckbox,
  FormError,
  FormInput,
  FormRadioGroup,
  FormSelect,
  FormTextarea,
} from '@/components/forms/form-fields';
import { FormProvider } from '@/components/forms/form-provider';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { z } from 'zod';
import { setupComponentTest } from '../../utils/test-env-setup';

// Setup the test environment
setupComponentTest();

// Mock the form context
jest.mock('@/components/forms/form-provider', () => {
  const originalModule = jest.requireActual('@/components/forms/form-provider');

  return {
    ...originalModule,
    useFormValidation: () => ({
      register: (name: string) => ({
        name,
        onChange: jest.fn(),
        onBlur: jest.fn(),
      }),
      formState: {
        errors: {},
        isValidating: false,
      },
      validateField: jest.fn().mockResolvedValue(true),
      watch: jest.fn(),
      setValue: jest.fn(),
      getValue: jest.fn(),
    }),
  };
});

describe('Form Field Components', () => {
  describe('FormInput', () => {
    it('renders correctly with label and placeholder', () => {
      render(
        <FormProvider schema={z.object({ name: z.string() })} onSubmit={jest.fn()}>
          <FormInput name='name' label='الاسم' placeholder='أدخل اسمك' />
        </FormProvider>
      );

      expect(screen.getByLabelText('الاسم')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('أدخل اسمك')).toBeInTheDocument();
    });

    it('shows required indicator when required is true', () => {
      render(
        <FormProvider schema={z.object({ name: z.string() })} onSubmit={jest.fn()}>
          <FormInput name='name' label='الاسم' required={true} />
        </FormProvider>
      );

      const label = screen.getByText('الاسم');
      expect(label.parentElement).toHaveClass("after:content-['*']");
    });

    it('is accessible', async () => {
      const { container } = render(
        <FormProvider schema={z.object({ name: z.string() })} onSubmit={jest.fn()}>
          <FormInput name='name' label='الاسم' placeholder='أدخل اسمك' />
        </FormProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('FormTextarea', () => {
    it('renders correctly with label and placeholder', () => {
      render(
        <FormProvider schema={z.object({ message: z.string() })} onSubmit={jest.fn()}>
          <FormTextarea name='message' label='الرسالة' placeholder='أدخل رسالتك' />
        </FormProvider>
      );

      expect(screen.getByLabelText('الرسالة')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('أدخل رسالتك')).toBeInTheDocument();
    });

    it('shows character count when maxLength is provided', () => {
      render(
        <FormProvider schema={z.object({ message: z.string() })} onSubmit={jest.fn()}>
          <FormTextarea name='message' label='الرسالة' maxLength={100} />
        </FormProvider>
      );

      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('is accessible', async () => {
      const { container } = render(
        <FormProvider schema={z.object({ message: z.string() })} onSubmit={jest.fn()}>
          <FormTextarea name='message' label='الرسالة' placeholder='أدخل رسالتك' />
        </FormProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('FormSelect', () => {
    const options = [
      { value: 'option1', label: 'الخيار الأول' },
      { value: 'option2', label: 'الخيار الثاني' },
    ];

    it('renders correctly with options', () => {
      render(
        <FormProvider schema={z.object({ choice: z.string() })} onSubmit={jest.fn()}>
          <FormSelect name='choice' label='الاختيار' options={options} />
        </FormProvider>
      );

      expect(screen.getByLabelText('الاختيار')).toBeInTheDocument();
    });

    it('is accessible', async () => {
      const { container } = render(
        <FormProvider schema={z.object({ choice: z.string() })} onSubmit={jest.fn()}>
          <FormSelect name='choice' label='الاختيار' options={options} />
        </FormProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('FormCheckbox', () => {
    it('renders correctly with text', () => {
      render(
        <FormProvider schema={z.object({ agree: z.boolean() })} onSubmit={jest.fn()}>
          <FormCheckbox name='agree' text='أوافق على الشروط والأحكام' />
        </FormProvider>
      );

      expect(screen.getByText('أوافق على الشروط والأحكام')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('is accessible', async () => {
      const { container } = render(
        <FormProvider schema={z.object({ agree: z.boolean() })} onSubmit={jest.fn()}>
          <FormCheckbox name='agree' text='أوافق على الشروط والأحكام' />
        </FormProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('FormRadioGroup', () => {
    const options = [
      { value: 'option1', label: 'الخيار الأول' },
      { value: 'option2', label: 'الخيار الثاني' },
    ];

    it('renders correctly with options', () => {
      render(
        <FormProvider schema={z.object({ choice: z.string() })} onSubmit={jest.fn()}>
          <FormRadioGroup name='choice' label='الاختيار' options={options} />
        </FormProvider>
      );

      expect(screen.getByLabelText('الاختيار')).toBeInTheDocument();
      expect(screen.getByText('الخيار الأول')).toBeInTheDocument();
      expect(screen.getByText('الخيار الثاني')).toBeInTheDocument();
    });

    it('is accessible', async () => {
      const { container } = render(
        <FormProvider schema={z.object({ choice: z.string() })} onSubmit={jest.fn()}>
          <FormRadioGroup name='choice' label='الاختيار' options={options} />
        </FormProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('FormError', () => {
    it('renders error message correctly', () => {
      render(<FormError error='هذا الحقل مطلوب' />);

      expect(screen.getByText('هذا الحقل مطلوب')).toBeInTheDocument();
    });

    it('renders multiple error messages', () => {
      render(<FormError error={['الخطأ الأول', 'الخطأ الثاني']} />);

      expect(screen.getByText('الخطأ الأول')).toBeInTheDocument();
      expect(screen.getByText('الخطأ الثاني')).toBeInTheDocument();
    });

    it('does not render when error is undefined', () => {
      const { container } = render(<FormError error={undefined} />);

      expect(container.firstChild).toBeNull();
    });

    it('is accessible', async () => {
      const { container } = render(<FormError error='هذا الحقل مطلوب' />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
