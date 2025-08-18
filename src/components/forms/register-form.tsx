'use client';

// Registration form component with validation

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { RegisterFormSchema, validatePassword, z, type RegisterFormInput } from '@/lib/validation';
import Link from 'next/link';
import React from 'react';
import { FormCheckbox, FormInput } from './form-fields';
import { FormActions, FormProvider, FormSection, SubmitButton } from './form-provider';

interface RegisterFormProps {
  onSubmit: (data: RegisterFormInput) => Promise<void>;
  redirectTo?: string;
  className?: string;
}

export function RegisterForm({ onSubmit, redirectTo, className = '' }: RegisterFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'RegisterForm' },
  });

  const [passwordStrength, setPasswordStrength] = React.useState<{
    strength: 'weak' | 'medium' | 'strong';
    score: number;
    issues: string[];
  }>({
    strength: 'weak',
    score: 0,
    issues: [],
  });

  const handleSubmit = async (data: RegisterFormInput) => {
    try {
      clearError();
      await onSubmit(data);
    } catch (err) {
      handleError(err as Error);
    }
  };

  const handlePasswordChange = (password: string) => {
    const validation = validatePassword(password);
    const score = validation.strength === 'strong' ? 100 : validation.strength === 'medium' ? 60 : 20;

    setPasswordStrength({
      strength: validation.strength,
      score,
      issues: validation.issues,
    });
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'قوية';
      case 'medium':
        return 'متوسطة';
      default:
        return 'ضعيفة';
    }
  };

  return (
    <Card className={`w-full max-w-lg ${className}`}>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>إنشاء حساب جديد</CardTitle>
        <CardDescription>أنشئ حسابك للاستمتاع بتجربة تسوق مميزة</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className='mb-6'>
            <ErrorDisplay error={error} onDismiss={clearError} />
          </div>
        )}

        <FormProvider
          schema={RegisterFormSchema}
          defaultValues={{
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            acceptTerms: false,
          }}
          mode='onChange'
          onSubmit={handleSubmit}
          className='space-y-6'
        >
          {/* Personal Information */}
          <FormSection title='المعلومات الشخصية' description='أدخل معلوماتك الأساسية'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormInput
                name='firstName'
                label='الاسم الأول'
                placeholder='أدخل اسمك الأول'
                required
                autoComplete='given-name'
                dir='auto'
              />

              <FormInput
                name='lastName'
                label='الاسم الأخير'
                placeholder='أدخل اسمك الأخير'
                required
                autoComplete='family-name'
                dir='auto'
              />
            </div>

            <FormInput
              name='email'
              type='email'
              label='البريد الإلكتروني'
              placeholder='example@domain.com'
              required
              autoComplete='email'
              dir='ltr'
              description='سيتم استخدام هذا البريد لتسجيل الدخول'
            />
          </FormSection>

          {/* Password Section */}
          <FormSection title='كلمة المرور' description='اختر كلمة مرور قوية لحماية حسابك'>
            <div className='space-y-4'>
              <FormInput
                name='password'
                type='password'
                label='كلمة المرور'
                placeholder='أدخل كلمة مرور قوية'
                required
                autoComplete='new-password'
                dir='ltr'
              />

              {/* Password Strength Indicator */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span>قوة كلمة المرور:</span>
                  <span
                    className={`font-medium ${
                      passwordStrength.strength === 'strong'
                        ? 'text-green-600'
                        : passwordStrength.strength === 'medium'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {getStrengthText(passwordStrength.strength)}
                  </span>
                </div>

                <Progress value={passwordStrength.score} className='h-2' />

                {passwordStrength.issues.length > 0 && (
                  <ul className='text-xs text-gray-600 space-y-1'>
                    {passwordStrength.issues.map((issue, index) => (
                      <li key={index} className='flex items-center'>
                        <span className='w-1 h-1 bg-gray-400 rounded-full mr-2'></span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <FormInput
                name='confirmPassword'
                type='password'
                label='تأكيد كلمة المرور'
                placeholder='أعد إدخال كلمة المرور'
                required
                autoComplete='new-password'
                dir='ltr'
              />
            </div>
          </FormSection>

          {/* Terms and Conditions */}
          <FormSection>
            <FormCheckbox name='acceptTerms' text='أوافق على الشروط والأحكام وسياسة الخصوصية' required />

            <p className='text-xs text-gray-600 mt-2'>
              بإنشاء حساب، فإنك توافق على{' '}
              <Link href='/terms' className='text-blue-600 hover:underline'>
                الشروط والأحكام
              </Link>{' '}
              و{' '}
              <Link href='/privacy' className='text-blue-600 hover:underline'>
                سياسة الخصوصية
              </Link>
              .
            </p>
          </FormSection>

          {/* Form Actions */}
          <FormActions>
            <SubmitButton className='w-full' loadingText='جاري إنشاء الحساب...'>
              إنشاء الحساب
            </SubmitButton>
          </FormActions>
        </FormProvider>

        <div className='mt-6'>
          <Separator className='my-4' />

          <p className='text-center text-sm text-gray-600'>
            لديك حساب بالفعل؟{' '}
            <Link
              href={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className='text-blue-600 hover:text-blue-800 underline'
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick registration form for modals
interface QuickRegisterFormProps {
  onSubmit: (data: Pick<RegisterFormInput, 'email' | 'password' | 'firstName' | 'lastName'>) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function QuickRegisterForm({ onSubmit, onCancel, className = '' }: QuickRegisterFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'QuickRegisterForm' },
  });

  const quickSchema = z.object({
    email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صحيح'),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    firstName: z.string().min(2, 'الاسم الأول يجب أن يكون حرفين على الأقل').max(50, 'الاسم الأول طويل جداً'),
    lastName: z.string().min(2, 'اسم العائلة يجب أن يكون حرفين على الأقل').max(50, 'اسم العائلة طويل جداً'),
  });

  const handleSubmit = async (data: Pick<RegisterFormInput, 'email' | 'password' | 'firstName' | 'lastName'>) => {
    try {
      clearError();
      await onSubmit(data);
    } catch (err) {
      handleError(err as Error);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className='text-center'>
        <h3 className='text-lg font-medium'>إنشاء حساب سريع</h3>
        <p className='text-sm text-gray-600'>أدخل معلوماتك الأساسية</p>
      </div>

      {error && <ErrorDisplay error={error} onDismiss={clearError} />}

      <FormProvider schema={quickSchema} mode='onBlur' onSubmit={handleSubmit} className='space-y-3'>
        <div className='grid grid-cols-2 gap-3'>
          <FormInput name='firstName' label='الاسم الأول' placeholder='الاسم الأول' required dir='auto' />

          <FormInput name='lastName' label='الاسم الأخير' placeholder='الاسم الأخير' required dir='auto' />
        </div>

        <FormInput
          name='email'
          type='email'
          label='البريد الإلكتروني'
          placeholder='example@domain.com'
          required
          dir='ltr'
        />

        <FormInput name='password' type='password' label='كلمة المرور' placeholder='كلمة المرور' required dir='ltr' />

        <div className='flex gap-2'>
          {onCancel && (
            <button
              type='button'
              onClick={onCancel}
              className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
            >
              إلغاء
            </button>
          )}

          <SubmitButton className='flex-1'>إنشاء حساب</SubmitButton>
        </div>
      </FormProvider>
    </div>
  );
}
