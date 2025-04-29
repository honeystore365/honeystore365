import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: {
    default: 'مناحل الرحيق - متجر العسل الطبيعي ومنتجاته',
    template: '%s | مناحل الرحيق'
  },
  description: 'متجر متخصص في بيع العسل الطبيعي ومنتجاته مثل حبوب اللقاح، البروبوليس، شمع العسل والعسل الملكي',
  keywords: ['عسل', 'مناحل', 'منتجات نحل', 'عسل طبيعي', 'حبوب لقاح', 'بروبوليس'],
  icons: {
    icon: '/favicon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_AR',
    url: 'https://nectar-hives.com',
    siteName: 'مناحل الرحيق',
  },
};
