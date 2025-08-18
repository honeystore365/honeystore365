'use client';

// Profile form component with validation and error handling

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { ProfileFormSchema, type ProfileFormInput } from '@/lib/validation';
import React from 'react';
import { FormFileInput, FormInput, FormTextarea } from './form-fields';
import { CancelButton, FormActions, FormProvider, FormSection, SubmitButton } from './form-provider';

interface ProfileFormProps {
  initialData?: Partial<ProfileFormInput>;
  onSubmit: (data: ProfileFormInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ProfileForm({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}: ProfileFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'ProfileForm' },
  });

  const [avatarPreview, setAvatarPreview] = React.useState<string>(initialData.avatar || '');

  const handleSubmit = async (data: ProfileFormInput) => {
    try {
      clearError();
      await onSubmit(data);
    } catch (err) {
      handleError(err as Error);
    }
  };

  const handleAvatarChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = e => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>الملف الشخصي</CardTitle>
        <CardDescription>قم بتحديث معلومات ملفك الشخصي وإعدادات الحساب</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className='mb-6'>
            <ErrorDisplay error={error} onDismiss={clearError} />
          </div>
        )}

        <FormProvider
          schema={ProfileFormSchema}
          defaultValues={initialData}
          mode='onChange'
          onSubmit={handleSubmit}
          className='space-y-8'
        >
          {/* Avatar Section */}
          <FormSection title='الصورة الشخصية' description='اختر صورة شخصية لحسابك'>
            <div className='flex items-center space-x-6 space-x-reverse'>
              <Avatar className='h-24 w-24'>
                <AvatarImage src={avatarPreview} alt='الصورة الشخصية' />
                <AvatarFallback className='text-lg'>
                  {getInitials(initialData.firstName, initialData.lastName)}
                </AvatarFallback>
              </Avatar>

              <div className='flex-1'>
                <FormFileInput
                  name='avatar'
                  label='رفع صورة جديدة'
                  description='JPG, PNG أو WebP. الحد الأقصى 2MB.'
                  accept='image/jpeg,image/png,image/webp'
                  maxSize={2 * 1024 * 1024}
                  onFileChange={handleAvatarChange}
                />
              </div>
            </div>
          </FormSection>

          {/* Personal Information */}
          <FormSection title='المعلومات الشخصية' description='معلوماتك الأساسية التي تظهر في ملفك الشخصي'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
            />

            <FormInput
              name='phone'
              type='tel'
              label='رقم الهاتف'
              placeholder='+966 50 123 4567'
              autoComplete='tel'
              dir='ltr'
              description='رقم الهاتف المحمول للتواصل معك'
            />

            <FormInput
              name='dateOfBirth'
              type='date'
              label='تاريخ الميلاد'
              autoComplete='bday'
              description='تاريخ ميلادك (اختياري)'
            />
          </FormSection>

          {/* Additional Information */}
          <FormSection title='معلومات إضافية' description='معلومات اختيارية لتحسين تجربتك'>
            <FormTextarea
              name='bio'
              label='نبذة شخصية'
              placeholder='اكتب نبذة مختصرة عن نفسك...'
              rows={4}
              maxLength={500}
              description='نبذة مختصرة تظهر في ملفك الشخصي'
              dir='auto'
            />

            <FormInput
              name='website'
              type='url'
              label='الموقع الإلكتروني'
              placeholder='https://example.com'
              dir='ltr'
              description='رابط موقعك الشخصي أو المهني'
            />
          </FormSection>

          {/* Form Actions */}
          <FormActions>
            {onCancel && <CancelButton onClick={onCancel}>إلغاء</CancelButton>}

            <SubmitButton loadingText='جاري الحفظ...' disabled={isLoading}>
              حفظ التغييرات
            </SubmitButton>
          </FormActions>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

// Simplified profile form for quick edits
interface QuickProfileFormProps {
  initialData?: Partial<Pick<ProfileFormInput, 'firstName' | 'lastName' | 'email'>>;
  onSubmit: (data: Pick<ProfileFormInput, 'firstName' | 'lastName' | 'email'>) => Promise<void>;
  onCancel?: () => void;
}

export function QuickProfileForm({ initialData = {}, onSubmit, onCancel }: QuickProfileFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'QuickProfileForm' },
  });

  const quickSchema = ProfileFormSchema.pick({
    firstName: true,
    lastName: true,
    email: true,
  });

  const handleSubmit = async (data: Pick<ProfileFormInput, 'firstName' | 'lastName' | 'email'>) => {
    try {
      clearError();
      await onSubmit(data);
    } catch (err) {
      handleError(err as Error);
    }
  };

  return (
    <div className='space-y-6'>
      {error && <ErrorDisplay error={error} onDismiss={clearError} />}

      <FormProvider
        schema={quickSchema}
        defaultValues={initialData}
        mode='onChange'
        onSubmit={handleSubmit}
        className='space-y-4'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormInput name='firstName' label='الاسم الأول' placeholder='أدخل اسمك الأول' required dir='auto' />

          <FormInput name='lastName' label='الاسم الأخير' placeholder='أدخل اسمك الأخير' required dir='auto' />
        </div>

        <FormInput
          name='email'
          type='email'
          label='البريد الإلكتروني'
          placeholder='example@domain.com'
          required
          dir='ltr'
        />

        <FormActions>
          {onCancel && <CancelButton onClick={onCancel}>إلغاء</CancelButton>}

          <SubmitButton>حفظ</SubmitButton>
        </FormActions>
      </FormProvider>
    </div>
  );
}
