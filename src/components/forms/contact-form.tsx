'use client';

// Contact form component with validation

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { ContactFormSchema, type ContactFormInput } from '@/lib/validation';
import { CheckCircle } from 'lucide-react';
import React from 'react';
import { FormInput, FormSelect, FormTextarea } from './form-fields';
import { FormActions, FormProvider, FormSection, SubmitButton } from './form-provider';

interface ContactFormProps {
  onSubmit: (data: ContactFormInput) => Promise<void>;
  className?: string;
}

export function ContactForm({ onSubmit, className = '' }: ContactFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'ContactForm' },
  });

  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = async (data: ContactFormInput) => {
    try {
      clearError();
      await onSubmit(data);
      setIsSubmitted(true);
    } catch (err) {
      handleError(err as Error);
    }
  };

  const categoryOptions = [
    { value: 'general', label: 'استفسار عام' },
    { value: 'support', label: 'دعم فني' },
    { value: 'complaint', label: 'شكوى' },
    { value: 'suggestion', label: 'اقتراح' },
    { value: 'order', label: 'استفسار عن طلب' },
  ];

  if (isSubmitted) {
    return (
      <Card className={className}>
        <CardContent className='pt-6'>
          <Alert className='border-green-200 bg-green-50'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <AlertDescription className='text-green-800'>
              تم إرسال رسالتك بنجاح! سنقوم بالرد عليك في أقرب وقت ممكن.
            </AlertDescription>
          </Alert>

          <div className='mt-4 text-center'>
            <button onClick={() => setIsSubmitted(false)} className='text-blue-600 hover:text-blue-800 underline'>
              إرسال رسالة أخرى
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>تواصل معنا</CardTitle>
        <CardDescription>نحن هنا لمساعدتك. أرسل لنا رسالة وسنقوم بالرد عليك في أقرب وقت ممكن.</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className='mb-6'>
            <ErrorDisplay error={error} onDismiss={clearError} />
          </div>
        )}

        <FormProvider
          schema={ContactFormSchema}
          defaultValues={{
            category: 'general',
          }}
          mode='onChange'
          onSubmit={handleSubmit}
          className='space-y-6'
        >
          {/* Personal Information */}
          <FormSection title='معلومات التواصل' description='معلوماتك الشخصية للتواصل معك'>
            <FormInput
              name='name'
              label='الاسم الكامل'
              placeholder='أدخل اسمك الكامل'
              required
              autoComplete='name'
              dir='auto'
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                name='phone'
                type='tel'
                label='رقم الهاتف'
                placeholder='+966 50 123 4567'
                autoComplete='tel'
                dir='ltr'
                description='رقم الهاتف للتواصل السريع (اختياري)'
              />
            </div>
          </FormSection>

          {/* Message Details */}
          <FormSection title='تفاصيل الرسالة' description='اكتب رسالتك بالتفصيل'>
            <FormSelect
              name='category'
              label='نوع الاستفسار'
              placeholder='اختر نوع الاستفسار'
              required
              options={categoryOptions}
            />

            <FormInput
              name='subject'
              label='موضوع الرسالة'
              placeholder='اكتب موضوع رسالتك'
              required
              dir='auto'
              description='موضوع مختصر يوضح محتوى رسالتك'
            />

            <FormTextarea
              name='message'
              label='الرسالة'
              placeholder='اكتب رسالتك هنا...'
              required
              rows={6}
              maxLength={2000}
              dir='auto'
              description='اشرح استفسارك أو مشكلتك بالتفصيل'
            />
          </FormSection>

          {/* Form Actions */}
          <FormActions>
            <SubmitButton loadingText='جاري الإرسال...' className='w-full md:w-auto'>
              إرسال الرسالة
            </SubmitButton>
          </FormActions>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

// Quick contact form for simple inquiries
interface QuickContactFormProps {
  onSubmit: (data: Pick<ContactFormInput, 'name' | 'email' | 'message'>) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export function QuickContactForm({
  onSubmit,
  placeholder = 'اكتب رسالتك هنا...',
  className = '',
}: QuickContactFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'QuickContactForm' },
  });

  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const quickSchema = ContactFormSchema.pick({
    name: true,
    email: true,
    message: true,
  });

  const handleSubmit = async (data: Pick<ContactFormInput, 'name' | 'email' | 'message'>) => {
    try {
      clearError();
      await onSubmit(data);
      setIsSubmitted(true);
    } catch (err) {
      handleError(err as Error);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert className='border-green-200 bg-green-50'>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <AlertDescription className='text-green-800'>تم إرسال رسالتك بنجاح!</AlertDescription>
        </Alert>

        <button onClick={() => setIsSubmitted(false)} className='text-blue-600 hover:text-blue-800 underline text-sm'>
          إرسال رسالة أخرى
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {error && <ErrorDisplay error={error} onDismiss={clearError} />}

      <FormProvider schema={quickSchema} mode='onBlur' onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormInput name='name' label='الاسم' placeholder='اسمك الكامل' required dir='auto' />

          <FormInput
            name='email'
            type='email'
            label='البريد الإلكتروني'
            placeholder='example@domain.com'
            required
            dir='ltr'
          />
        </div>

        <FormTextarea
          name='message'
          label='الرسالة'
          placeholder={placeholder}
          required
          rows={4}
          maxLength={1000}
          dir='auto'
        />

        <SubmitButton className='w-full'>إرسال</SubmitButton>
      </FormProvider>
    </div>
  );
}
