// Hooks de traduction simplifiés pour les composants d'erreur

export function useCommonTranslations() {
  return {
    errors: {
      generic: 'حدث خطأ غير متوقع',
      errorCode: 'رمز الخطأ',
    },
    common: {
      retry: 'إعادة المحاولة',
      close: 'إغلاق',
      loading: 'جاري التحميل',
      error: 'خطأ',
      goHome: 'العودة للرئيسية',
      save: 'حفظ',
      cancel: 'إلغاء',
    },
    forms: {
      validationError: 'خطأ في التحقق من البيانات',
    },
    navigation: {
      home: 'الرئيسية',
      products: 'المنتجات',
      cart: 'السلة',
      profile: 'الملف الشخصي',
      orders: 'الطلبات',
      contact: 'اتصل بنا',
    },
  };
}

export function useProductTranslations() {
  return {
    name: 'اسم المنتج',
    title: 'العنوان',
    price: 'السعر',
    description: 'الوصف',
    category: 'الفئة',
    stock: 'المخزون',
    addToCart: 'أضف إلى السلة',
    outOfStock: 'نفد من المخزون',
  };
}

export function useI18n() {
  return {
    locale: 'ar',
    direction: 'rtl',
    isRtl: true,
    currency: {
      code: 'TND',
      symbol: 'د.ت',
    },
    t: (key: string) => key, // Simple fallback
    formatters: {
      currency: (amount: number) => `${amount.toFixed(2)} د.ت`,
      number: (num: number) => num.toLocaleString('ar'),
      date: (date: Date, options?: any) => date.toLocaleDateString('ar', options),
      phone: (phone: string) => phone,
      phoneNumber: (phone: string) => {
        // Simple phone number formatting for Saudi/Gulf numbers
        if (phone.startsWith('966')) {
          return `+${phone.slice(0, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
        }
        if (phone.startsWith('0')) {
          return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
        }
        return phone;
      },
      relativeTime: (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'اليوم';
        if (days === 1) return 'أمس';
        return `منذ ${days} أيام`;
      },
      percentage: (value: number) => `${(value * 100).toFixed(1)}%`,
      fileSize: (bytes: number) => {
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        if (bytes === 0) return '0 بايت';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
      },
    },
    rtl: {
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      classes: (options: { common?: string; ltr?: string; rtl?: string }) => {
        return `${options.common || ''} ${options.rtl || ''}`.trim();
      },
      class: (className: string) => {
        // Simple RTL class mapping
        const rtlMappings: Record<string, string> = {
          textLeft: 'text-right',
          flexRow: 'flex-row-reverse',
          ml: 'mr',
          mr: 'ml',
          pl: 'pr',
          pr: 'pl',
        };
        return rtlMappings[className] || className;
      },
    },
  };
}