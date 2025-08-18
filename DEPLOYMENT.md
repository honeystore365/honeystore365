# 🚀 دليل النشر على Vercel

## 📋 قائمة التحقق قبل النشر

### ✅ الملفات الأساسية

- [x] `vercel.json` - إعدادات Vercel
- [x] `.env.example` - مثال متغيرات البيئة
- [x] `README.md` - دليل المشروع
- [x] `package.json` - التبعيات والسكريبتات

### ✅ قاعدة البيانات

- [ ] تشغيل `src/lib/database/checkout-migration.sql`
- [ ] تشغيل `src/lib/database/store-settings-migration.sql`
- [ ] إنشاء حساب admin في جدول `profiles`
- [ ] تفعيل RLS على جميع الجداول

### ✅ متغيرات البيئة

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

## 🌐 خطوات النشر على Vercel

### 1. إعداد المشروع في Vercel

```bash
# تثبيت Vercel CLI (اختياري)
npm i -g vercel

# ربط المشروع
vercel link
```

### 2. إضافة متغيرات البيئة

في Vercel Dashboard:

1. اذهب إلى Project Settings
2. اختر Environment Variables
3. أضف المتغيرات التالية:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
```

### 3. إعداد قاعدة البيانات

في Supabase SQL Editor، شغل الملفات التالية بالترتيب:

```sql
-- 1. إعداد الجداول الأساسية
-- نسخ محتوى src/lib/database/checkout-migration.sql

-- 2. إعداد إعدادات المتجر
-- نسخ محتوى src/lib/database/store-settings-migration.sql
```

### 4. إنشاء حساب Admin

```sql
-- إنشاء حساب admin
INSERT INTO profiles (email, role, full_name) VALUES
('admin@honeystore.com', 'admin', 'مدير المتجر');
```

### 5. النشر

```bash
# النشر اليدوي
vercel --prod

# أو push إلى main branch للنشر التلقائي
git push origin main
```

## 🔧 إعدادات Vercel المتقدمة

### Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Functions Configuration

- **Max Duration**: 30 seconds
- **Memory**: 1024 MB
- **Region**: Frankfurt (fra1) للأداء الأفضل في المنطقة العربية

### Domain Configuration

```
# Custom Domain (اختياري)
honeystore.vercel.app
# أو
your-custom-domain.com
```

## 🛡️ الأمان في الإنتاج

### 1. متغيرات البيئة

- لا تضع المفاتيح السرية في الكود
- استخدم Vercel Environment Variables
- فعل "Sensitive" للمفاتيح الحساسة

### 2. قاعدة البيانات

- فعل RLS على جميع الجداول
- راجع صلاحيات الوصول
- استخدم Service Role Key بحذر

### 3. API Routes

- تحقق من المصادقة في كل API
- استخدم rate limiting
- تحقق من صحة البيانات المدخلة

## 📊 مراقبة الأداء

### Vercel Analytics

```bash
# تفعيل Analytics
npm install @vercel/analytics
```

### Monitoring

- راقب استخدام Functions
- تحقق من أوقات الاستجابة
- راقب الأخطاء في Dashboard

## 🔄 التحديثات

### Continuous Deployment

- كل push إلى `main` ينشر تلقائياً
- Preview deployments للـ branches الأخرى
- Rollback سريع في حالة المشاكل

### Database Migrations

```sql
-- لتحديث قاعدة البيانات
-- أضف الـ migrations الجديدة في src/lib/database/
-- شغلها يدوياً في Supabase
```

## 🚨 استكشاف الأخطاء

### مشاكل شائعة

1. **Build Errors**

```bash
# تحقق من الأخطاء محلياً
npm run build
npm run lint
```

2. **Environment Variables**

```bash
# تأكد من وجود جميع المتغيرات
vercel env ls
```

3. **Database Connection**

```bash
# تحقق من صحة URLs و Keys
# راجع Supabase Dashboard
```

### Logs

```bash
# عرض logs الإنتاج
vercel logs your-deployment-url
```

## ✅ اختبار ما بعد النشر

### 1. الوظائف الأساسية

- [ ] تحميل الصفحة الرئيسية
- [ ] تسجيل الدخول/الخروج
- [ ] إضافة منتج للسلة
- [ ] إتمام طلب
- [ ] الوصول للوحة الإدارة

### 2. الأداء

- [ ] سرعة تحميل الصفحات < 3 ثواني
- [ ] عمل الصور والأيقونات
- [ ] استجابة التصميم على الأجهزة المختلفة

### 3. الأمان

- [ ] حماية المسارات الإدارية
- [ ] عدم تسريب البيانات الحساسة
- [ ] عمل HTTPS

## 📞 الدعم

في حالة مواجهة مشاكل:

1. راجع Vercel Dashboard للأخطاء
2. تحقق من Supabase Logs
3. راجع هذا الدليل
4. أنشئ Issue في GitHub

---

**نشر موفق! 🎉**
