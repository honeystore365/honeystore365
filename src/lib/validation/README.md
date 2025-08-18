# نظام التحقق من صحة البيانات (Validation System)

نظام شامل للتحقق من صحة البيانات باستخدام Zod مع دعم كامل للغة العربية ومتطلبات
تطبيق التجارة الإلكترونية للعسل.

## الميزات الرئيسية

- **مخططات Zod شاملة**: تغطي جميع كيانات قاعدة البيانات
- **رسائل خطأ مترجمة**: رسائل واضحة باللغة العربية
- **تحقق في الوقت الفعلي**: تحقق فوري أثناء الكتابة
- **React Hooks**: خطافات مخصصة لسهولة الاستخدام
- **قواعد الأعمال**: تحقق من منطق الأعمال المخصص
- **دعم الملفات**: تحقق من رفع الملفات والصور

## البنية

```
src/lib/validation/
├── types.ts          # أنواع البيانات والواجهات
├── schemas.ts        # مخططات Zod لكيانات قاعدة البيانات
├── forms.ts          # مخططات النماذج المخصصة
├── utils.ts          # وظائف التحقق المساعدة
├── hooks.ts          # React Hooks للتحقق
├── index.ts          # الصادرات الرئيسية
└── README.md        # هذا الملف
```

## الاستخدام

### 1. مخططات قاعدة البيانات

```typescript
import { ProductSchema, CustomerSchema, OrderSchema } from '@/lib/validation';

// التحقق من بيانات المنتج
const productResult = ProductSchema.safeParse({
  name: 'عسل السدر الطبيعي',
  price: 150.0,
  stock: 25,
  description: 'عسل طبيعي من أشجار السدر',
});

if (productResult.success) {
  console.log('بيانات المنتج صحيحة:', productResult.data);
} else {
  console.log('أخطاء التحقق:', productResult.error.errors);
}
```

### 2. نماذج التحقق

```typescript
import {
  LoginFormSchema,
  RegisterFormSchema,
  ProfileFormSchema,
} from '@/lib/validation';

// نموذج تسجيل الدخول
const loginData = {
  email: 'user@example.com',
  password: 'password123',
  remember: true,
};

const loginResult = LoginFormSchema.safeParse(loginData);
```

### 3. استخدام React Hooks

```tsx
import { useFormValidation } from '@/lib/validation';
import { ProfileFormSchema } from '@/lib/validation';

function ProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useFormValidation({
    schema: ProfileFormSchema,
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  const onSubmit = async data => {
    console.log('بيانات صحيحة:', data);
    // إرسال البيانات
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('firstName')} placeholder='الاسم الأول' />
        {errors.firstName && <span className='error'>{errors.firstName}</span>}
      </div>

      <div>
        <input {...register('lastName')} placeholder='الاسم الأخير' />
        {errors.lastName && <span className='error'>{errors.lastName}</span>}
      </div>

      <div>
        <input
          type='email'
          {...register('email')}
          placeholder='البريد الإلكتروني'
        />
        {errors.email && <span className='error'>{errors.email}</span>}
      </div>

      <button type='submit' disabled={!isValid || isSubmitting}>
        {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
      </button>
    </form>
  );
}
```

### 4. التحقق المخصص

```typescript
import {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
} from '@/lib/validation';

// التحقق من البريد الإلكتروني
const isValidEmail = validateEmail('user@example.com');

// التحقق من قوة كلمة المرور
const passwordCheck = validatePassword('MyPassword123!');
console.log(passwordCheck.strength); // 'strong'
console.log(passwordCheck.issues); // []

// التحقق من رقم الهاتف
const isValidPhone = validatePhoneNumber('+966501234567');
```

### 5. التحقق غير المتزامن

```tsx
import { useAsyncValidation } from '@/lib/validation';

function EmailInput() {
  const { isValidating, error, validate } = useAsyncValidation(
    async email => {
      // التحقق من وجود البريد الإلكتروني في قاعدة البيانات
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
      <input
        type='email'
        onChange={e => validate(e.target.value)}
        placeholder='البريد الإلكتروني'
      />
      {isValidating && <span>جاري التحقق...</span>}
      {error && <span className='error'>{error}</span>}
    </div>
  );
}
```

## المخططات المتاحة

### مخططات قاعدة البيانات

- `CustomerSchema` - بيانات العملاء
- `ProductSchema` - بيانات المنتجات
- `CategorySchema` - فئات المنتجات
- `OrderSchema` - الطلبات
- `OrderItemSchema` - عناصر الطلبات
- `CartSchema` - السلة
- `CartItemSchema` - عناصر السلة
- `AddressSchema` - العناوين
- `PaymentSchema` - المدفوعات
- `ReviewSchema` - المراجعات
- `WishlistSchema` - قائمة الأمنيات

### مخططات النماذج

- `LoginFormSchema` - نموذج تسجيل الدخول
- `RegisterFormSchema` - نموذج التسجيل
- `ProfileFormSchema` - نموذج الملف الشخصي
- `AddressFormSchema` - نموذج العنوان
- `ProductFormSchema` - نموذج المنتج (للإدارة)
- `ReviewFormSchema` - نموذج المراجعة
- `ContactFormSchema` - نموذج الاتصال
- `CheckoutFormSchema` - نموذج الدفع

## وظائف التحقق المساعدة

### التحقق من البيانات الأساسية

```typescript
import {
  validateEmail,
  validatePhoneNumber,
  validateUrl,
  validatePrice,
  validateQuantity,
  validateRating,
} from '@/lib/validation';

// أمثلة على الاستخدام
const isValidEmail = validateEmail('user@example.com');
const isValidPhone = validatePhoneNumber('+966501234567');
const isValidUrl = validateUrl('https://example.com');
const isValidPrice = validatePrice(99.99);
const isValidQuantity = validateQuantity(5);
const isValidRating = validateRating(4);
```

### التحقق من النصوص

```typescript
import {
  validateArabicText,
  validateEnglishText,
  validateMixedText,
  normalizeArabicText,
} from '@/lib/validation';

// التحقق من النص العربي
const isArabic = validateArabicText('مرحبا بكم');

// التحقق من النص الإنجليزي
const isEnglish = validateEnglishText('Hello World');

// التحقق من النص المختلط
const isMixed = validateMixedText('مرحبا Hello 123');

// تطبيع النص العربي
const normalized = normalizeArabicText('مرحباً بكم');
```

### التحقق من الملفات

```typescript
import { validateFileUpload, validateMultipleFiles } from '@/lib/validation';

// التحقق من ملف واحد
const fileValidation = validateFileUpload(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
});

if (!fileValidation.isValid) {
  console.log('خطأ في الملف:', fileValidation.error);
}

// التحقق من ملفات متعددة
const filesValidation = validateMultipleFiles(files, {
  maxFiles: 5,
  maxSize: 2 * 1024 * 1024, // 2MB per file
  allowedTypes: ['image/jpeg', 'image/png'],
});

if (!filesValidation.isValid) {
  console.log('أخطاء الملفات:', filesValidation.errors);
}
```

## قواعد الأعمال

```typescript
import { validateBusinessRules } from '@/lib/validation';

// التحقق من توفر المنتج
const inStock = validateBusinessRules.productInStock(10, 5); // true

// التحقق من إمكانية مراجعة المنتج
const canReview = validateBusinessRules.canReviewProduct(true, false); // true

// التحقق من إمكانية إلغاء الطلب
const canCancel = validateBusinessRules.canCancelOrder('pending', new Date());

// التحقق من صحة كود الخصم
const isDiscountValid = validateBusinessRules.isDiscountValid(
  {
    isActive: true,
    expiryDate: new Date('2024-12-31'),
    usageLimit: 100,
    usageCount: 50,
  },
  200, // مبلغ الطلب
  100 // الحد الأدنى للطلب
);
```

## التكامل مع النماذج

### مع React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileFormSchema } from '@/lib/validation';

function ProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ProfileFormSchema),
    mode: 'onChange',
  });

  const onSubmit = data => {
    console.log('بيانات صحيحة:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('firstName')} placeholder='الاسم الأول' />
      {errors.firstName && <span>{errors.firstName.message}</span>}

      <button type='submit'>حفظ</button>
    </form>
  );
}
```

### مع Formik

```tsx
import { Formik, Form, Field } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { ProfileFormSchema } from '@/lib/validation';

function ProfileForm() {
  return (
    <Formik
      initialValues={{
        firstName: '',
        lastName: '',
        email: '',
      }}
      validationSchema={toFormikValidationSchema(ProfileFormSchema)}
      onSubmit={values => {
        console.log('بيانات صحيحة:', values);
      }}
    >
      {({ errors, touched }) => (
        <Form>
          <Field name='firstName' placeholder='الاسم الأول' />
          {errors.firstName && touched.firstName && (
            <div>{errors.firstName}</div>
          )}

          <button type='submit'>حفظ</button>
        </Form>
      )}
    </Formik>
  );
}
```

## Server Actions والتحقق

```typescript
// app/actions/profile.ts
import { ProfileFormSchema } from '@/lib/validation';
import { validateSchema } from '@/lib/validation';

export async function updateProfile(formData: FormData) {
  const data = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
  };

  const validation = validateSchema(ProfileFormSchema, data);

  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  // حفظ البيانات في قاعدة البيانات
  try {
    await saveProfile(validation.data);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      errors: [
        { field: 'root', message: 'خطأ في حفظ البيانات', code: 'save_error' },
      ],
    };
  }
}
```

## API Routes والتحقق

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProductSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = ProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        },
        { status: 400 }
      );
    }

    // إنشاء المنتج
    const product = await createProduct(validation.data);

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
```

## التخصيص والتوسيع

### إضافة مخططات جديدة

```typescript
// lib/validation/custom-schemas.ts
import { z } from 'zod';
import { ValidationMessages } from './types';

export const CustomProductSchema = z.object({
  name: z.string().min(1, ValidationMessages.required),
  customField: z
    .string()
    .min(5, 'الحقل المخصص يجب أن يحتوي على 5 أحرف على الأقل'),
  tags: z.array(z.string()).max(10, 'يمكن إضافة 10 علامات كحد أقصى'),
});
```

### إضافة رسائل خطأ مخصصة

```typescript
// lib/validation/custom-messages.ts
export const CustomValidationMessages = {
  ...ValidationMessages,
  customRequired: 'هذا الحقل مطلوب للمتابعة',
  customEmail: 'يرجى إدخال بريد إلكتروني صحيح من نطاق الشركة',
  customPassword: 'كلمة المرور يجب أن تحتوي على رمز خاص من الشركة',
};
```

## أفضل الممارسات

1. **استخدم المخططات المناسبة**: اختر المخطط المناسب لكل حالة استخدام
2. **تحقق من الجانبين**: تحقق من البيانات في العميل والخادم
3. **رسائل واضحة**: استخدم رسائل خطأ واضحة ومفيدة
4. **التحقق التدريجي**: تحقق من البيانات أثناء الكتابة للحصول على تجربة أفضل
5. **معالجة الأخطاء**: تعامل مع أخطاء التحقق بشكل مناسب
6. **الأداء**: استخدم التأخير (debouncing) للتحقق المكلف

## الاختبار

```typescript
// __tests__/validation.test.ts
import {
  ProductSchema,
  validateEmail,
  validatePassword,
} from '@/lib/validation';

describe('Product Validation', () => {
  it('should validate valid product data', () => {
    const validProduct = {
      name: 'عسل السدر',
      price: 100,
      stock: 10,
      description: 'عسل طبيعي',
    };

    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('should reject invalid product data', () => {
    const invalidProduct = {
      name: '', // اسم فارغ
      price: -10, // سعر سالب
      stock: 'invalid', // مخزون غير صحيح
    };

    const result = ProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });
});

describe('Utility Functions', () => {
  it('should validate email correctly', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });

  it('should validate password strength', () => {
    const result = validatePassword('StrongPass123!');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('strong');
  });
});
```

## الدعم والمساهمة

لإضافة ميزات جديدة أو الإبلاغ عن مشاكل:

1. إنشاء issue في المستودع
2. اتباع معايير الكود الموجودة
3. إضافة اختبارات للميزات الجديدة
4. تحديث الوثائق عند الحاجة
5. التأكد من دعم اللغة العربية في الرسائل الجديدة
