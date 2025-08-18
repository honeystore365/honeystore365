# نظام النماذج المتقدم (Advanced Forms System)

نظام شامل للنماذج مع التحقق من صحة البيانات، معالجة الأخطاء، وتجربة مستخدم محسنة
للتطبيق العربي.

## الميزات الرئيسية

- **تحقق متقدم**: تكامل كامل مع نظام Zod للتحقق من صحة البيانات
- **معالجة الأخطاء**: عرض أخطاء واضحة ومترجمة باللغة العربية
- **تجربة مستخدم محسنة**: تحقق في الوقت الفعلي وتغذية راجعة فورية
- **مكونات قابلة للإعادة**: مكونات نماذج مرنة وقابلة للتخصيص
- **دعم RTL**: دعم كامل للغة العربية واتجاه النص من اليمين لليسار
- **إمكانية الوصول**: مطابقة لمعايير WCAG 2.1 AA

## البنية

```
src/components/forms/
├── form-provider.tsx     # مزود النماذج والمكونات الأساسية
├── form-fields.tsx       # حقول النماذج القابلة للإعادة
├── profile-form.tsx      # نموذج الملف الشخصي
├── address-form.tsx      # نموذج العنوان
├── contact-form.tsx      # نموذج التواصل
├── login-form.tsx        # نموذج تسجيل الدخول
├── register-form.tsx     # نموذج التسجيل
├── review-form.tsx       # نموذج المراجعة
├── search-form.tsx       # نموذج البحث
├── index.ts             # الصادرات الرئيسية
└── README.md           # هذا الملف
```

## الاستخدام

### 1. المكونات الأساسية

#### FormProvider

```tsx
import { FormProvider, SubmitButton } from '@/components/forms';
import { ProfileFormSchema } from '@/lib/validation';

function MyForm() {
  const handleSubmit = async data => {
    console.log('بيانات النموذج:', data);
  };

  return (
    <FormProvider
      schema={ProfileFormSchema}
      defaultValues={{ firstName: '', lastName: '' }}
      mode='onChange'
      onSubmit={handleSubmit}
    >
      {/* حقول النموذج هنا */}
      <SubmitButton>حفظ</SubmitButton>
    </FormProvider>
  );
}
```

#### حقول النماذج

```tsx
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
} from '@/components/forms';

function FormFields() {
  return (
    <>
      <FormInput
        name='firstName'
        label='الاسم الأول'
        placeholder='أدخل اسمك الأول'
        required
        dir='auto'
      />

      <FormTextarea
        name='bio'
        label='نبذة شخصية'
        placeholder='اكتب نبذة عن نفسك...'
        rows={4}
        maxLength={500}
        dir='auto'
      />

      <FormSelect
        name='city'
        label='المدينة'
        placeholder='اختر المدينة'
        required
        options={[
          { value: 'riyadh', label: 'الرياض' },
          { value: 'jeddah', label: 'جدة' },
        ]}
      />

      <FormCheckbox
        name='acceptTerms'
        text='أوافق على الشروط والأحكام'
        required
      />
    </>
  );
}
```

### 2. النماذج المتخصصة

#### نموذج الملف الشخصي

```tsx
import { ProfileForm } from '@/components/forms';

function ProfilePage() {
  const handleSubmit = async data => {
    // حفظ بيانات الملف الشخصي
    await updateProfile(data);
  };

  return (
    <ProfileForm
      initialData={{
        firstName: 'أحمد',
        lastName: 'محمد',
        email: 'ahmed@example.com',
      }}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
```

#### نموذج العنوان

```tsx
import { AddressForm } from '@/components/forms';

function AddressPage() {
  const handleSubmit = async data => {
    await saveAddress(data);
  };

  return (
    <AddressForm
      title='عنوان التوصيل'
      description='أدخل عنوان التوصيل الخاص بك'
      onSubmit={handleSubmit}
      showDefaultOption={true}
    />
  );
}
```

#### نموذج تسجيل الدخول

```tsx
import { LoginForm } from '@/components/forms';

function LoginPage() {
  const handleSubmit = async data => {
    await signIn(data.email, data.password);
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <LoginForm
      onSubmit={handleSubmit}
      onForgotPassword={handleForgotPassword}
      showRememberMe={true}
      redirectTo='/dashboard'
    />
  );
}
```

#### نموذج التسجيل

```tsx
import { RegisterForm } from '@/components/forms';

function RegisterPage() {
  const handleSubmit = async data => {
    await createAccount(data);
  };

  return <RegisterForm onSubmit={handleSubmit} redirectTo='/dashboard' />;
}
```

#### نموذج المراجعة

```tsx
import { ReviewForm } from '@/components/forms';

function ProductReview({ productId, productName }) {
  const handleSubmit = async data => {
    await submitReview(data);
  };

  return (
    <ReviewForm
      productId={productId}
      productName={productName}
      onSubmit={handleSubmit}
      onCancel={() => setShowReview(false)}
    />
  );
}
```

#### نموذج البحث

```tsx
import { SearchForm } from '@/components/forms';

function SearchPage() {
  const handleSubmit = async data => {
    const results = await searchProducts(data);
    setSearchResults(results);
  };

  const categories = [
    { value: 'honey', label: 'العسل' },
    { value: 'dates', label: 'التمور' },
  ];

  return (
    <SearchForm
      onSubmit={handleSubmit}
      categories={categories}
      showAdvancedFilters={true}
      onReset={() => setSearchResults([])}
    />
  );
}
```

#### نموذج التواصل

```tsx
import { ContactForm } from '@/components/forms';

function ContactPage() {
  const handleSubmit = async data => {
    await sendContactMessage(data);
  };

  return <ContactForm onSubmit={handleSubmit} />;
}
```

### 3. النماذج المدمجة

#### نموذج دخول مدمج

```tsx
import { CompactLoginForm } from '@/components/forms';

function LoginModal({ onClose }) {
  const handleSubmit = async data => {
    await signIn(data.email, data.password);
    onClose();
  };

  return <CompactLoginForm onSubmit={handleSubmit} onCancel={onClose} />;
}
```

#### نموذج بحث مدمج

```tsx
import { CompactSearchForm } from '@/components/forms';

function HeaderSearch() {
  const handleSubmit = async query => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <CompactSearchForm
      onSubmit={handleSubmit}
      placeholder='ابحث عن المنتجات...'
    />
  );
}
```

## التخصيص والتوسيع

### إنشاء نموذج مخصص

```tsx
import { FormProvider, FormInput, SubmitButton } from '@/components/forms';
import { z } from 'zod';

// تعريف مخطط التحقق
const CustomFormSchema = z.object({
  customField: z.string().min(1, 'الحقل مطلوب'),
  anotherField: z.string().email('بريد إلكتروني غير صحيح'),
});

function CustomForm({ onSubmit }) {
  return (
    <FormProvider
      schema={CustomFormSchema}
      mode='onChange'
      onSubmit={onSubmit}
      className='space-y-4'
    >
      <FormInput
        name='customField'
        label='حقل مخصص'
        placeholder='أدخل القيمة'
        required
      />

      <FormInput
        name='anotherField'
        type='email'
        label='البريد الإلكتروني'
        placeholder='example@domain.com'
        required
      />

      <SubmitButton>إرسال</SubmitButton>
    </FormProvider>
  );
}
```

### إنشاء حقل مخصص

```tsx
import { useFormValidation } from '@/components/forms';
import { FormField } from '@/components/forms';

function CustomField({ name, label, ...props }) {
  const { setValue, getValue, formState } = useFormValidation();
  const { errors } = formState;
  const value = getValue(name);
  const error = errors[name];

  return (
    <FormField name={name} label={label} error={error}>
      <input
        value={value || ''}
        onChange={e => setValue(name, e.target.value)}
        className='custom-input-class'
        {...props}
      />
    </FormField>
  );
}
```

## التكامل مع Server Actions

```tsx
// app/actions/profile.ts
import { ProfileFormSchema } from '@/lib/validation';

export async function updateProfileAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());

  const validation = ProfileFormSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.errors,
    };
  }

  try {
    await updateUserProfile(validation.data);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'فشل في حفظ البيانات',
    };
  }
}

// في المكون
import { updateProfileAction } from '@/app/actions/profile';

function ProfileForm() {
  const handleSubmit = async data => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await updateProfileAction(formData);

    if (!result.success) {
      throw new Error(result.error || 'حدث خطأ');
    }
  };

  return <ProfileForm onSubmit={handleSubmit} />;
}
```

## معالجة الأخطاء

### عرض الأخطاء

```tsx
import { ErrorDisplay } from '@/components/ui/error-display';
import { useErrorHandling } from '@/hooks/use-error-handling';

function FormWithErrorHandling() {
  const { error, handleError, clearError } = useErrorHandling();

  const handleSubmit = async data => {
    try {
      clearError();
      await submitData(data);
    } catch (err) {
      handleError(err, { action: 'submit_form' });
    }
  };

  return (
    <div>
      {error && (
        <ErrorDisplay
          error={error}
          onDismiss={clearError}
          onRetry={() => handleSubmit(lastData)}
        />
      )}

      <FormProvider onSubmit={handleSubmit}>{/* حقول النموذج */}</FormProvider>
    </div>
  );
}
```

### التحقق المخصص

```tsx
import { useAsyncValidation } from '@/lib/validation/hooks';

function EmailField() {
  const { isValidating, error, validate } = useAsyncValidation(
    async email => {
      const response = await fetch(`/api/check-email?email=${email}`);
      const { exists } = await response.json();

      return {
        isValid: !exists,
        error: exists ? 'البريد الإلكتروني مستخدم بالفعل' : undefined,
      };
    },
    { debounceMs: 500 }
  );

  return (
    <div>
      <FormInput
        name='email'
        type='email'
        label='البريد الإلكتروني'
        onChange={e => validate(e.target.value)}
      />
      {isValidating && <span>جاري التحقق...</span>}
      {error && <span className='error'>{error}</span>}
    </div>
  );
}
```

## إمكانية الوصول

### ARIA Labels والدعم

```tsx
// جميع حقول النماذج تتضمن دعم إمكانية الوصول تلقائياً
<FormInput
  name="email"
  label="البريد الإلكتروني"
  description="سيتم استخدام هذا البريد لتسجيل الدخول"
  required
  // يتم إضافة aria-describedby و aria-invalid تلقائياً
/>

// دعم قارئ الشاشة للأخطاء
<FormField name="password" error="كلمة المرور ضعيفة">
  <input aria-invalid="true" aria-describedby="password-error" />
</FormField>
```

### التنقل بلوحة المفاتيح

```tsx
// جميع النماذج تدعم التنقل بلوحة المفاتيح
function AccessibleForm() {
  return (
    <FormProvider onSubmit={handleSubmit}>
      <FormInput name='field1' /> {/* Tab للانتقال */}
      <FormInput name='field2' /> {/* Shift+Tab للعودة */}
      <SubmitButton>إرسال</SubmitButton> {/* Enter للإرسال */}
    </FormProvider>
  );
}
```

## الأداء والتحسين

### Lazy Loading للنماذج الكبيرة

```tsx
import { lazy, Suspense } from 'react';

const ProfileForm = lazy(() => import('@/components/forms/profile-form'));

function ProfilePage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <ProfileForm onSubmit={handleSubmit} />
    </Suspense>
  );
}
```

### تحسين إعادة الرسم

```tsx
import { memo } from 'react';

const OptimizedFormField = memo(FormInput);

// استخدام useCallback للدوال
const handleSubmit = useCallback(async data => {
  await submitData(data);
}, []);
```

## الاختبار

### اختبار النماذج

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileForm } from '@/components/forms';

describe('ProfileForm', () => {
  it('should validate required fields', async () => {
    const mockSubmit = jest.fn();

    render(<ProfileForm onSubmit={mockSubmit} />);

    const submitButton = screen.getByText('حفظ التغييرات');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('الاسم الأول مطلوب')).toBeInTheDocument();
    });

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid data', async () => {
    const mockSubmit = jest.fn();

    render(<ProfileForm onSubmit={mockSubmit} />);

    fireEvent.change(screen.getByLabelText('الاسم الأول'), {
      target: { value: 'أحمد' },
    });

    fireEvent.change(screen.getByLabelText('الاسم الأخير'), {
      target: { value: 'محمد' },
    });

    fireEvent.click(screen.getByText('حفظ التغييرات'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        firstName: 'أحمد',
        lastName: 'محمد',
        // ... باقي البيانات
      });
    });
  });
});
```

## أفضل الممارسات

1. **استخدم المخططات المناسبة**: اختر مخطط التحقق المناسب لكل نموذج
2. **معالجة الأخطاء**: تعامل مع الأخطاء بشكل مناسب وأظهر رسائل واضحة
3. **تجربة المستخدم**: استخدم التحقق في الوقت الفعلي للحقول المهمة
4. **إمكانية الوصول**: تأكد من دعم قارئات الشاشة والتنقل بلوحة المفاتيح
5. **الأداء**: استخدم lazy loading للنماذج الكبيرة
6. **الاختبار**: اكتب اختبارات شاملة للنماذج المهمة

## الدعم والمساهمة

لإضافة ميزات جديدة أو الإبلاغ عن مشاكل:

1. إنشاء issue في المستودع
2. اتباع معايير الكود الموجودة
3. إضافة اختبارات للميزات الجديدة
4. تحديث الوثائق عند الحاجة
5. التأكد من دعم اللغة العربية في المكونات الجديدة
