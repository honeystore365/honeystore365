'use client';

// Login form component with validation

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Separator } from '@/components/ui/separator';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { LoginFormSchema, type LoginFormInput } from '@/lib/validation';
import Link from 'next/link';
import { FormCheckbox, FormInput } from './form-fields';
import { FormProvider, SubmitButton } from './form-provider';

interface LoginFormProps {
  onSubmit: (data: LoginFormInput) => Promise<void>;
  onForgotPassword?: () => void;
  showRememberMe?: boolean;
  redirectTo?: string;
  className?: string;
}

export function LoginForm({
  onSubmit,
  onForgotPassword,
  showRememberMe = true,
  redirectTo,
  className = '',
}: LoginFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'LoginForm' },
  });

  const handleSubmit = async (data: LoginFormInput) => {
    try {
      clearError();
      await onSubmit(data);
    } catch (err) {
      handleError(err as Error);
    }
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>تسجيل الدخول</CardTitle>
        <CardDescription>أدخل بياناتك للوصول إلى حسابك</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className='mb-6'>
            <ErrorDisplay error={error} onDismiss={clearError} />
          </div>
        )}

        <FormProvider
          schema={LoginFormSchema}
          defaultValues={{
            email: '',
            password: '',
            remember: false,
          }}
          mode='onSubmit'
          onSubmit={handleSubmit}
          className='space-y-4'
        >
          <FormInput
            name='email'
            type='email'
            label='البريد الإلكتروني'
            placeholder='example@domain.com'
            required
            autoComplete='email'
            dir='ltr'
          />

          <FormInput
            name='password'
            type='password'
            label='كلمة المرور'
            placeholder='أدخل كلمة المرور'
            required
            autoComplete='current-password'
            dir='ltr'
          />

          <div className='flex items-center justify-between'>
            {showRememberMe && <FormCheckbox name='remember' text='تذكرني' />}

            {onForgotPassword && (
              <button
                type='button'
                onClick={onForgotPassword}
                className='text-sm text-blue-600 hover:text-blue-800 underline'
              >
                نسيت كلمة المرور؟
              </button>
            )}
          </div>

          <SubmitButton className='w-full' loadingText='جاري تسجيل الدخول...'>
            تسجيل الدخول
          </SubmitButton>
        </FormProvider>

        <div className='mt-6'>
          <Separator className='my-4' />

          <p className='text-center text-sm text-gray-600'>
            ليس لديك حساب؟{' '}
            <Link
              href={`/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className='text-blue-600 hover:text-blue-800 underline'
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact login form for modals or sidebars
interface CompactLoginFormProps {
  onSubmit: (data: Pick<LoginFormInput, 'email' | 'password'>) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function CompactLoginForm({ onSubmit, onCancel, className = '' }: CompactLoginFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'CompactLoginForm' },
  });

  const compactSchema = LoginFormSchema.pick({
    email: true,
    password: true,
  });

  const handleSubmit = async (data: Pick<LoginFormInput, 'email' | 'password'>) => {
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
        <h3 className='text-lg font-medium'>تسجيل الدخول</h3>
        <p className='text-sm text-gray-600'>أدخل بياناتك للمتابعة</p>
      </div>

      {error && <ErrorDisplay error={error} onDismiss={clearError} />}

      <FormProvider schema={compactSchema} mode='onSubmit' onSubmit={handleSubmit} className='space-y-3'>
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

          <SubmitButton className='flex-1'>دخول</SubmitButton>
        </div>
      </FormProvider>
    </div>
  );
}
