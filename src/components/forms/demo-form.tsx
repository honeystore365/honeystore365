'use client';

// Demo form showcasing all enhanced reusable form components
// This demonstrates the improved validation, UX, and accessibility features

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import {
  CancelButton,
  FormActions,
  FormCheckbox,
  FormFileInput,
  FormInput,
  FormProvider,
  FormRadioGroup,
  FormSection,
  FormSelect,
  FormTextarea,
  SubmitButton,
} from './index';

// Comprehensive validation schema demonstrating various field types
const DemoFormSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'الاسم الأول يجب أن يكون على الأقل حرفين').max(50, 'الاسم الأول طويل جداً'),
  lastName: z.string().min(2, 'اسم العائلة يجب أن يكون على الأقل حرفين').max(50, 'اسم العائلة طويل جداً'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().min(8, 'رقم الهاتف غير صحيح').max(20, 'رقم الهاتف طويل جداً'),
  dateOfBirth: z.string().optional(),

  // Address Information
  address: z.string().min(5, 'العنوان يجب أن يكون على الأقل 5 أحرف').max(200, 'العنوان طويل جداً'),
  city: z.string().min(2, 'اسم المدينة يجب أن يكون على الأقل حرفين'),
  country: z.string().min(1, 'يرجى اختيار الدولة'),

  // Preferences
  bio: z.string().max(500, 'النبذة الشخصية طويلة جداً').optional(),
  newsletter: z.boolean(),
  notifications: z.enum(['all', 'important', 'none'], {
    errorMap: () => ({ message: 'يرجى اختيار نوع الإشعارات' }),
  }),

  // File Upload
  avatar: z.any().optional(),

  // Terms and Conditions
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'يجب الموافقة على الشروط والأحكام',
  }),
});

type DemoFormData = z.infer<typeof DemoFormSchema>;

interface DemoFormProps {
  onSubmit?: (data: DemoFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<DemoFormData>;
  className?: string;
}

export function DemoForm({ onSubmit, onCancel, initialData = {}, className = '' }: DemoFormProps) {
  const { toast } = useToast();

  const defaultValues: Partial<DemoFormData> = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    bio: '',
    newsletter: false,
    notifications: 'important',
    acceptTerms: false,
    ...initialData,
  };

  const handleSubmit = async (data: DemoFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Demo submission
        console.log('Form submitted with data:', data);
        toast({
          title: 'تم إرسال النموذج بنجاح!',
          description: 'تم حفظ جميع البيانات بنجاح.',
          variant: 'default',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ في إرسال النموذج',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع.',
        variant: 'destructive',
      });
    }
  };

  const handleError = (errors: any[]) => {
    toast({
      title: 'يرجى تصحيح الأخطاء',
      description: `يوجد ${errors.length} خطأ في النموذج`,
      variant: 'destructive',
    });
  };

  const countryOptions = [
    { value: 'tunisia', label: 'تونس' },
    { value: 'algeria', label: 'الجزائر' },
    { value: 'morocco', label: 'المغرب' },
    { value: 'egypt', label: 'مصر' },
    { value: 'saudi', label: 'السعودية' },
    { value: 'uae', label: 'الإمارات' },
  ];

  const notificationOptions = [
    {
      value: 'all',
      label: 'جميع الإشعارات',
      description: 'تلقي جميع الإشعارات والتحديثات',
    },
    {
      value: 'important',
      label: 'الإشعارات المهمة فقط',
      description: 'تلقي الإشعارات المهمة والعاجلة فقط',
    },
    {
      value: 'none',
      label: 'بدون إشعارات',
      description: 'عدم تلقي أي إشعارات',
    },
  ];

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle>نموذج تجريبي للمكونات المحسنة</CardTitle>
        <CardDescription>
          يعرض هذا النموذج جميع مكونات النماذج المحسنة مع التحقق من صحة البيانات في الوقت الفعلي
        </CardDescription>
      </CardHeader>

      <CardContent>
        <FormProvider
          schema={DemoFormSchema}
          defaultValues={defaultValues}
          mode='onChange'
          onSubmit={handleSubmit}
          onError={handleError}
          showFormErrors={true}
          autoFocus={true}
        >
          {/* Personal Information Section */}
          <FormSection title='المعلومات الشخصية' description='معلوماتك الأساسية' required>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormInput
                name='firstName'
                label='الاسم الأول'
                placeholder='أدخل اسمك الأول'
                required
                autoComplete='given-name'
                dir='auto'
                validateOnChange={true}
                debounceMs={300}
              />

              <FormInput
                name='lastName'
                label='اسم العائلة'
                placeholder='أدخل اسم العائلة'
                required
                autoComplete='family-name'
                dir='auto'
                validateOnChange={true}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormInput
                name='email'
                type='email'
                label='البريد الإلكتروني'
                placeholder='example@domain.com'
                required
                autoComplete='email'
                dir='ltr'
                description='سنستخدم هذا البريد للتواصل معك'
                validateOnChange={true}
              />

              <FormInput
                name='phone'
                type='tel'
                label='رقم الهاتف'
                placeholder='+216 12 345 678'
                required
                autoComplete='tel'
                dir='ltr'
                validateOnChange={true}
              />
            </div>

            <FormInput
              name='dateOfBirth'
              type='date'
              label='تاريخ الميلاد'
              autoComplete='bday'
              description='تاريخ ميلادك (اختياري)'
            />
          </FormSection>

          {/* Address Information Section */}
          <FormSection title='معلومات العنوان' description='عنوانك الحالي' collapsible={true} defaultCollapsed={false}>
            <FormTextarea
              name='address'
              label='العنوان الكامل'
              placeholder='أدخل عنوانك الكامل...'
              required
              rows={3}
              maxLength={200}
              dir='auto'
              description='العنوان الكامل بما في ذلك الشارع والرقم'
              showCharacterCount={true}
              validateOnChange={true}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormInput
                name='city'
                label='المدينة'
                placeholder='اسم المدينة'
                required
                autoComplete='address-level2'
                dir='auto'
              />

              <FormSelect
                name='country'
                label='الدولة'
                placeholder='اختر الدولة...'
                required
                options={countryOptions}
                description='اختر دولة الإقامة'
              />
            </div>
          </FormSection>

          {/* Profile Section */}
          <FormSection title='الملف الشخصي' description='معلومات إضافية عنك'>
            <FormTextarea
              name='bio'
              label='نبذة شخصية'
              placeholder='اكتب نبذة مختصرة عن نفسك...'
              rows={4}
              maxLength={500}
              dir='auto'
              description='نبذة مختصرة تظهر في ملفك الشخصي'
              showCharacterCount={true}
              resize='vertical'
            />

            <FormFileInput
              name='avatar'
              label='الصورة الشخصية'
              description='اختر صورة شخصية (JPG, PNG - الحد الأقصى 2MB)'
              accept='image/jpeg,image/png,image/webp'
              maxSize={2 * 1024 * 1024}
            />
          </FormSection>

          {/* Preferences Section */}
          <FormSection title='التفضيلات' description='إعدادات الحساب والإشعارات'>
            <FormRadioGroup
              name='notifications'
              label='نوع الإشعارات'
              required
              options={notificationOptions}
              orientation='vertical'
              description='اختر نوع الإشعارات التي تريد تلقيها'
            />

            <FormCheckbox
              name='newsletter'
              text='أريد تلقي النشرة الإخبارية الأسبوعية'
              description='ستتلقى آخر الأخبار والعروض الخاصة'
            />
          </FormSection>

          {/* Terms and Conditions */}
          <FormSection title='الشروط والأحكام' required>
            <FormCheckbox
              name='acceptTerms'
              text='أوافق على الشروط والأحكام وسياسة الخصوصية'
              required
              description='يجب الموافقة على الشروط للمتابعة'
            />
          </FormSection>

          {/* Form Actions */}
          <FormActions align='right'>
            {onCancel && <CancelButton onClick={onCancel}>إلغاء</CancelButton>}

            <SubmitButton
              loadingText='جاري الحفظ...'
              showValidationState={true}
              icon={
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
              }
            >
              حفظ البيانات
            </SubmitButton>
          </FormActions>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

// Simplified demo form for quick testing
export function SimpleDemoForm() {
  const { toast } = useToast();

  const simpleSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    message: z.string().min(10, 'الرسالة يجب أن تكون على الأقل 10 أحرف').max(200, 'الرسالة طويلة جداً'),
  });

  type SimpleFormData = z.infer<typeof simpleSchema>;

  const handleSubmit = async (data: SimpleFormData) => {
    console.log('Simple form submitted:', data);
    toast({
      title: 'تم الإرسال!',
      description: `شكراً ${data.name}، تم استلام رسالتك.`,
    });
  };

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader>
        <CardTitle>نموذج بسيط</CardTitle>
        <CardDescription>نموذج تجريبي مبسط</CardDescription>
      </CardHeader>

      <CardContent>
        <FormProvider
          schema={simpleSchema}
          defaultValues={{ name: '', email: '', message: '' }}
          mode='onChange'
          onSubmit={handleSubmit}
        >
          <FormInput name='name' label='الاسم' placeholder='أدخل اسمك' required dir='auto' />

          <FormInput
            name='email'
            type='email'
            label='البريد الإلكتروني'
            placeholder='example@domain.com'
            required
            dir='ltr'
          />

          <FormTextarea
            name='message'
            label='الرسالة'
            placeholder='اكتب رسالتك هنا...'
            required
            rows={4}
            maxLength={200}
            dir='auto'
          />

          <SubmitButton fullWidth>إرسال</SubmitButton>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
