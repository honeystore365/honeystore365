# نظام إدارة الأخطاء (Error Management System)

نظام شامل لإدارة الأخطاء في تطبيق التجارة الإلكترونية للعسل، يوفر معالجة موحدة
للأخطاء مع رسائل مترجمة ومناسبة للمستخدمين العرب.

## الميزات الرئيسية

- **أصناف أخطاء مخصصة**: أخطاء الأعمال، التحقق، الشبكة، المصادقة، الصلاحيات،
  والنظام
- **معالجة موحدة**: نظام موحد لمعالجة الأخطاء في جميع أنحاء التطبيق
- **رسائل مترجمة**: رسائل خطأ باللغة العربية مناسبة للمستخدمين
- **Error Boundaries**: حماية React من الأخطاء غير المتوقعة
- **إعادة المحاولة**: آلية ذكية لإعادة المحاولة للعمليات القابلة للإعادة
- **تسجيل متقدم**: تسجيل مفصل للأخطاء مع السياق المناسب

## البنية

```
src/lib/errors/
├── types.ts              # أنواع البيانات والواجهات
├── custom-errors.ts      # أصناف الأخطاء المخصصة
├── error-handler.ts      # معالج الأخطاء الرئيسي
├── error-boundary.tsx    # مكونات React Error Boundary
├── index.ts             # الصادرات الرئيسية
└── README.md           # هذا الملف
```

## الاستخدام

### 1. أصناف الأخطاء المخصصة

```typescript
import { BusinessError, ValidationError, NetworkError } from '@/lib/errors';

// خطأ في الأعمال
throw new BusinessError('المنتج غير متوفر', 'PRODUCT_OUT_OF_STOCK', 'medium', {
  productId: '123',
});

// خطأ في التحقق
throw new ValidationError(
  'البريد الإلكتروني مطلوب',
  'EMAIL_REQUIRED',
  'email',
  'required'
);

// خطأ في الشبكة
throw new NetworkError(
  'فشل في جلب البيانات',
  'FETCH_FAILED',
  500,
  '/api/products'
);
```

### 2. معالج الأخطاء

```typescript
import { errorHandler } from '@/lib/errors';

// معالجة خطأ العميل
const userError = errorHandler.handleClientError(error, {
  action: 'add_to_cart',
  userId: 'user123',
  component: 'ProductCard',
});

// معالجة خطأ الخادم
const apiResponse = errorHandler.handleServerError(error, {
  action: 'create_order',
  userId: 'user123',
});

// تغليف العمليات غير المتزامنة
const result = await errorHandler.wrapAsync(
  async () => {
    return await fetchProducts();
  },
  { action: 'fetch_products' },
  3 // عدد المحاولات
);
```

### 3. Error Boundary

```tsx
import { ErrorBoundary } from '@/lib/errors';

function App() {
  return (
    <ErrorBoundary
      fallback={(error, errorId, retry) => (
        <div>
          <h2>حدث خطأ</h2>
          <p>{error.message}</p>
          <button onClick={retry}>إعادة المحاولة</button>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 4. React Hooks

```tsx
import {
  useErrorHandling,
  useAsyncOperation,
} from '@/hooks/use-error-handling';

function MyComponent() {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'MyComponent' },
  });

  const { isLoading, execute } = useAsyncOperation();

  const handleSubmit = async () => {
    await execute(async () => {
      // عملية غير متزامنة
      await submitForm();
    });
  };

  return (
    <div>
      {error && <ErrorDisplay error={error} onDismiss={clearError} />}
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'جاري الإرسال...' : 'إرسال'}
      </button>
    </div>
  );
}
```

### 5. مكونات عرض الأخطاء

```tsx
import {
  ErrorDisplay,
  ErrorToast,
  ErrorPage,
  LoadingError
} from '@/components/ui/error-display';

// عرض خطأ عادي
<ErrorDisplay
  error={error}
  onRetry={handleRetry}
  onDismiss={clearError}
/>

// إشعار خطأ
<ErrorToast
  error={error}
  onClose={closeToast}
  autoClose={true}
/>

// صفحة خطأ كاملة
<ErrorPage
  error={error}
  onRetry={handleRetry}
  onGoHome={() => router.push('/')}
/>
```

## أنواع الأخطاء

### 1. BusinessError

أخطاء منطق الأعمال مثل نفاد المخزون أو عدم وجود المنتج.

### 2. ValidationError

أخطاء التحقق من صحة البيانات في النماذج.

### 3. NetworkError

أخطاء الشبكة وطلبات API.

### 4. AuthError

أخطاء المصادقة وتسجيل الدخول.

### 5. PermissionError

أخطاء الصلاحيات والوصول.

### 6. SystemError

أخطاء النظام وقاعدة البيانات.

## أخطاء الأعمال المخصصة

```typescript
// أخطاء خاصة بتطبيق العسل
import {
  ProductNotFoundError,
  InsufficientStockError,
  CartEmptyError,
  OrderNotFoundError,
} from '@/lib/errors';

// استخدام الأخطاء المخصصة
throw new ProductNotFoundError('123');
throw new InsufficientStockError('123', 5, 2);
throw new CartEmptyError();
throw new OrderNotFoundError('order-456');
```

## التكامل مع النظام

### Server Actions

```typescript
import { handleServerError } from '@/lib/errors';

export async function createOrder(data: OrderData) {
  try {
    // منطق إنشاء الطلب
    const order = await orderService.create(data);
    return { success: true, data: order };
  } catch (error) {
    return handleServerError(error as Error, {
      action: 'create_order',
      userId: data.userId,
    });
  }
}
```

### API Routes

```typescript
import { handleServerError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const products = await getProducts();
    return Response.json({ success: true, data: products });
  } catch (error) {
    const errorResponse = handleServerError(error as Error, {
      action: 'get_products',
    });
    return Response.json(errorResponse, { status: 500 });
  }
}
```

## التخصيص

### إضافة أنواع أخطاء جديدة

```typescript
export class CustomBusinessError extends BusinessError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CUSTOM_ERROR', 'medium', context);
  }

  toUserFriendlyError() {
    return {
      message: 'رسالة مخصصة للمستخدم',
      code: this.code,
      severity: 'error' as const,
      translationKey: 'errors.custom.myError',
    };
  }
}
```

### تخصيص Error Boundary

```tsx
const CustomErrorBoundary = withErrorBoundary(MyComponent, {
  fallback: (error, errorId, retry) => (
    <CustomErrorFallback error={error} onRetry={retry} />
  ),
  onError: (error, errorInfo) => {
    // معالجة مخصصة للخطأ
    console.log('Custom error handling:', error);
  },
});
```

## أفضل الممارسات

1. **استخدم الأخطاء المناسبة**: اختر نوع الخطأ المناسب لكل حالة
2. **أضف السياق**: قدم معلومات مفيدة في سياق الخطأ
3. **رسائل واضحة**: استخدم رسائل واضحة ومفهومة للمستخدم
4. **تسجيل مناسب**: سجل الأخطاء بالمستوى المناسب
5. **إعادة المحاولة**: استخدم إعادة المحاولة للعمليات المناسبة
6. **Error Boundaries**: استخدم Error Boundaries لحماية التطبيق

## التطوير والاختبار

```typescript
// اختبار معالجة الأخطاء
import { errorHandler } from '@/lib/errors';

describe('Error Handler', () => {
  it('should handle business errors correctly', () => {
    const error = new BusinessError('Test error', 'TEST_ERROR');
    const result = errorHandler.handleClientError(error);

    expect(result.message).toBe('Test error');
    expect(result.code).toBe('TEST_ERROR');
    expect(result.severity).toBe('error');
  });
});
```

## الدعم والمساهمة

لإضافة ميزات جديدة أو الإبلاغ عن مشاكل، يرجى:

1. إنشاء issue في المستودع
2. اتباع معايير الكود الموجودة
3. إضافة اختبارات للميزات الجديدة
4. تحديث الوثائق عند الحاجة
