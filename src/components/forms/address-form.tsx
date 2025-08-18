'use client';

// Address form component with validation

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { AddressFormSchema, type AddressFormInput } from '@/lib/validation';
import { FormCheckbox, FormInput, FormSelect } from './form-fields';
import { CancelButton, FormActions, FormProvider, FormSection, SubmitButton } from './form-provider';

interface AddressFormProps {
  initialData?: Partial<AddressFormInput>;
  onSubmit: (data: AddressFormInput) => Promise<void>;
  onCancel?: () => void;
  title?: string;
  description?: string;
  showDefaultOption?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function AddressForm({
  initialData = {},
  onSubmit,
  onCancel,
  title = 'عنوان التوصيل',
  description = 'أدخل عنوان التوصيل الخاص بك',
  showDefaultOption = true,
  isLoading = false,
  className = '',
}: AddressFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'AddressForm' },
  });

  const handleSubmit = async (data: AddressFormInput) => {
    try {
      clearError();
      await onSubmit(data);
    } catch (err) {
      handleError(err as Error);
    }
  };

  // Saudi Arabia cities (can be expanded or fetched from API)
  const saudiCities = [
    { value: 'riyadh', label: 'الرياض' },
    { value: 'jeddah', label: 'جدة' },
    { value: 'mecca', label: 'مكة المكرمة' },
    { value: 'medina', label: 'المدينة المنورة' },
    { value: 'dammam', label: 'الدمام' },
    { value: 'khobar', label: 'الخبر' },
    { value: 'dhahran', label: 'الظهران' },
    { value: 'taif', label: 'الطائف' },
    { value: 'buraidah', label: 'بريدة' },
    { value: 'tabuk', label: 'تبوك' },
    { value: 'hail', label: 'حائل' },
    { value: 'khamis_mushait', label: 'خميس مشيط' },
    { value: 'abha', label: 'أبها' },
    { value: 'najran', label: 'نجران' },
    { value: 'jazan', label: 'جازان' },
    { value: 'arar', label: 'عرعر' },
    { value: 'sakaka', label: 'سكاكا' },
    { value: 'other', label: 'أخرى' },
  ];

  const saudiRegions = [
    { value: 'riyadh_region', label: 'منطقة الرياض' },
    { value: 'makkah_region', label: 'منطقة مكة المكرمة' },
    { value: 'eastern_region', label: 'المنطقة الشرقية' },
    { value: 'asir_region', label: 'منطقة عسير' },
    { value: 'madinah_region', label: 'منطقة المدينة المنورة' },
    { value: 'qassim_region', label: 'منطقة القصيم' },
    { value: 'hail_region', label: 'منطقة حائل' },
    { value: 'tabuk_region', label: 'منطقة تبوك' },
    { value: 'northern_borders', label: 'منطقة الحدود الشمالية' },
    { value: 'jazan_region', label: 'منطقة جازان' },
    { value: 'najran_region', label: 'منطقة نجران' },
    { value: 'bahah_region', label: 'منطقة الباحة' },
    { value: 'jouf_region', label: 'منطقة الجوف' },
  ];

  const countries = [
    { value: 'SA', label: 'المملكة العربية السعودية' },
    { value: 'AE', label: 'الإمارات العربية المتحدة' },
    { value: 'KW', label: 'الكويت' },
    { value: 'QA', label: 'قطر' },
    { value: 'BH', label: 'البحرين' },
    { value: 'OM', label: 'عمان' },
    { value: 'JO', label: 'الأردن' },
    { value: 'LB', label: 'لبنان' },
    { value: 'EG', label: 'مصر' },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className='mb-6'>
            <ErrorDisplay error={error} onDismiss={clearError} />
          </div>
        )}

        <FormProvider
          schema={AddressFormSchema}
          defaultValues={{ country: 'SA', ...initialData }}
          mode='onChange'
          onSubmit={handleSubmit}
          className='space-y-6'
        >
          {/* Address Lines */}
          <FormSection title='العنوان' description='أدخل عنوانك بالتفصيل'>
            <FormInput
              name='addressLine1'
              label='العنوان الأول'
              placeholder='رقم المبنى، اسم الشارع'
              required
              dir='auto'
              description='العنوان الرئيسي (مطلوب)'
            />

            <FormInput
              name='addressLine2'
              label='العنوان الثاني'
              placeholder='رقم الشقة، الدور، معلومات إضافية'
              dir='auto'
              description='معلومات إضافية عن العنوان (اختياري)'
            />
          </FormSection>

          {/* Location Details */}
          <FormSection title='تفاصيل الموقع' description='حدد المدينة والمنطقة والدولة'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormSelect name='city' label='المدينة' placeholder='اختر المدينة' required options={saudiCities} />

              <FormSelect name='state' label='المنطقة' placeholder='اختر المنطقة' required options={saudiRegions} />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormSelect name='country' label='الدولة' placeholder='اختر الدولة' required options={countries} />

              <FormInput
                name='postalCode'
                label='الرمز البريدي'
                placeholder='12345'
                required
                dir='ltr'
                description='الرمز البريدي للمنطقة'
              />
            </div>
          </FormSection>

          {/* Additional Options */}
          {showDefaultOption && (
            <FormSection>
              <FormCheckbox
                name='isDefault'
                text='جعل هذا العنوان الافتراضي'
                description='سيتم استخدام هذا العنوان كعنوان افتراضي للتوصيل'
              />
            </FormSection>
          )}

          {/* Form Actions */}
          <FormActions>
            {onCancel && <CancelButton onClick={onCancel}>إلغاء</CancelButton>}

            <SubmitButton loadingText='جاري الحفظ...' disabled={isLoading}>
              حفظ العنوان
            </SubmitButton>
          </FormActions>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

// Simplified address form for checkout
interface CheckoutAddressFormProps {
  initialData?: Partial<AddressFormInput>;
  onSubmit: (data: AddressFormInput) => Promise<void>;
  title?: string;
}

export function CheckoutAddressForm({ initialData = {}, onSubmit, title = 'عنوان التوصيل' }: CheckoutAddressFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'CheckoutAddressForm' },
  });

  const handleSubmit = async (data: AddressFormInput) => {
    try {
      clearError();
      await onSubmit(data);
    } catch (err) {
      handleError(err as Error);
    }
  };

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>{title}</h3>

      {error && <ErrorDisplay error={error} onDismiss={clearError} />}

      <FormProvider
        schema={AddressFormSchema}
        defaultValues={{ country: 'SA', ...initialData }}
        mode='onBlur'
        onSubmit={handleSubmit}
        className='space-y-4'
      >
        <FormInput name='addressLine1' label='العنوان' placeholder='رقم المبنى، اسم الشارع' required dir='auto' />

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <FormInput name='city' label='المدينة' placeholder='المدينة' required dir='auto' />

          <FormInput name='state' label='المنطقة' placeholder='المنطقة' required dir='auto' />

          <FormInput name='postalCode' label='الرمز البريدي' placeholder='12345' required dir='ltr' />
        </div>

        <SubmitButton className='w-full'>تأكيد العنوان</SubmitButton>
      </FormProvider>
    </div>
  );
}
