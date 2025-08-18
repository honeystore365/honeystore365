# 🖼️ تحسين الصور في HoneyStore

## 🚨 مشكلة الصور المحلولة

تم حل مشكلة `Invalid src prop` في Next.js Image من خلال:

### 1. تحديث `next.config.js`

```javascript
// إضافة الدومين Supabase تلقائياً
domains: [
  getSupabaseDomain(), // يستخرج الدومين من NEXT_PUBLIC_SUPABASE_URL
  'llsifflkfjogjagmbmpi.supabase.co', // الدومين الحالي
  'your-supabase-project.supabase.co', // دومين احتياطي
];
```

### 2. مكون `OptimizedImage`

```tsx
import { OptimizedImage } from '@/components/ui/optimized-image';

// استخدام بسيط
<OptimizedImage
  src="https://your-supabase.supabase.co/storage/v1/object/public/images/product.jpg"
  alt="منتج العسل"
  width={400}
  height={300}
/>

// مع fill للحاويات المرنة
<OptimizedImage
  src="/path/to/image.jpg"
  alt="وصف الصورة"
  fill
  className="rounded-lg"
/>
```

## 🎯 الميزات

### ✅ التحسينات المضمنة

- **تحميل تدريجي** - Lazy loading تلقائي
- **تحسين الحجم** - WebP و AVIF تلقائياً
- **Placeholder** - صورة احتياطية عند الفشل
- **Loading states** - حالات التحميل المرئية
- **Error handling** - معالجة أخطاء الصور

### 🔧 الخصائص المتاحة

```tsx
interface OptimizedImageProps {
  src: string; // مصدر الصورة (مطلوب)
  alt: string; // النص البديل (مطلوب)
  width?: number; // العرض (افتراضي: 400)
  height?: number; // الارتفاع (افتراضي: 300)
  className?: string; // CSS classes
  fill?: boolean; // ملء الحاوي
  priority?: boolean; // أولوية التحميل
  sizes?: string; // أحجام responsive
  fallbackSrc?: string; // صورة احتياطية
}
```

## 🛠️ أمثلة الاستخدام

### 1. صور المنتجات

```tsx
<OptimizedImage
  src={product.image_url}
  alt={product.name}
  width={300}
  height={300}
  className='rounded-lg shadow-md'
  priority={index < 4} // أولوية للصور الأولى
/>
```

### 2. صور البطل (Hero Images)

```tsx
<div className='relative h-96 w-full'>
  <OptimizedImage
    src='/images/hero-honey.jpg'
    alt='عسل طبيعي'
    fill
    priority
    sizes='100vw'
    className='object-cover'
  />
</div>
```

### 3. صور الأفاتار

```tsx
<div className='relative w-12 h-12 rounded-full overflow-hidden'>
  <OptimizedImage
    src={user.avatar_url}
    alt={user.name}
    fill
    className='object-cover'
  />
</div>
```

### 4. معرض الصور

```tsx
<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
  {images.map((image, index) => (
    <div key={image.id} className='relative aspect-square'>
      <OptimizedImage
        src={image.url}
        alt={image.alt}
        fill
        sizes='(max-width: 768px) 50vw, 25vw'
        className='rounded-lg object-cover hover:scale-105 transition-transform'
      />
    </div>
  ))}
</div>
```

## 🔧 إعدادات Supabase Storage

### 1. رفع الصور

```typescript
// رفع صورة منتج
const uploadProductImage = async (file: File, productId: string) => {
  const fileName = `${productId}-${Date.now()}.${file.name.split('.').pop()}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(`products/${fileName}`, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // الحصول على URL العام
  const {
    data: { publicUrl },
  } = supabase.storage
    .from('product-images')
    .getPublicUrl(`products/${fileName}`);

  return publicUrl;
};
```

### 2. حذف الصور

```typescript
const deleteProductImage = async (imagePath: string) => {
  const { error } = await supabase.storage
    .from('product-images')
    .remove([imagePath]);

  if (error) throw error;
};
```

## 📱 التصميم المتجاوب

### أحجام الصور المُحسنة

```tsx
// للشاشات المختلفة
sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

// للمنتجات
sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';

// للصور الكبيرة
sizes = '(max-width: 768px) 100vw, 80vw';
```

### CSS Grid مع الصور

```tsx
<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
  {products.map(product => (
    <div key={product.id} className='group'>
      <div className='relative aspect-square mb-4 overflow-hidden rounded-lg'>
        <OptimizedImage
          src={product.image_url}
          alt={product.name}
          fill
          sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
          className='object-cover group-hover:scale-110 transition-transform duration-300'
        />
      </div>
      <h3 className='font-semibold'>{product.name}</h3>
      <p className='text-green-600 font-bold'>{product.price} د.ت</p>
    </div>
  ))}
</div>
```

## 🎨 تأثيرات بصرية

### 1. تأثير التحميل

```css
/* في globals.css */
.image-loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### 2. تأثير Hover

```tsx
<OptimizedImage
  src={image.url}
  alt={image.alt}
  className='transition-all duration-300 hover:scale-105 hover:shadow-lg'
/>
```

## 🔍 تحسين SEO

### 1. النص البديل المحسن

```tsx
// جيد
<OptimizedImage alt="عسل زهور طبيعي 500 جرام" />

// أفضل
<OptimizedImage alt={`${product.name} - ${product.weight} - عسل طبيعي من ${product.origin}`} />
```

### 2. البيانات المنظمة

```tsx
// إضافة schema.org للمنتجات
<script type='application/ld+json'>
  {JSON.stringify({
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.image_url,
    description: product.description,
  })}
</script>
```

## 📊 مراقبة الأداء

### Core Web Vitals

- **LCP** - Largest Contentful Paint محسن
- **CLS** - Cumulative Layout Shift مقلل
- **FID** - First Input Delay محسن

### أدوات المراقبة

```bash
# تحليل الأداء
npm run build
npm run start

# في المتصفح
# Lighthouse audit
# Network tab للصور
# Performance tab
```

## 🚨 استكشاف الأخطاء

### مشاكل شائعة

1. **Domain not configured** - تحديث next.config.js
2. **Image not loading** - التحقق من URL
3. **Slow loading** - تحسين الأحجام
4. **Layout shift** - استخدام width/height

### حلول سريعة

```bash
# إعادة تشغيل dev server بعد تحديث next.config.js
npm run dev

# تنظيف cache
rm -rf .next
npm run dev
```

---

**الصور محسنة ومجهزة للإنتاج! 🖼️✨**
