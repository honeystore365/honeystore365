import type {Metadata} from 'next';
import './globals.css';
import {SidebarProvider} from '@/components/ui/sidebar';
import {SiteHeader} from '@/components/site-header';
import {Toaster} from '@/components/ui/toaster';
import { ChatbotPopup } from '@/components/chatbot-popup'; // Import ChatbotPopup
import { DebugSession } from '@/components/debug-session'; // Import DebugSession
import { DebugCookies } from '@/components/debug-cookies'; // Import DebugCookies

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-honey-light text-foreground antialiased">
        <DebugSession /> {/* Add DebugSession component */}
        <DebugCookies /> {/* Add DebugCookies component */}
        <SidebarProvider>
          <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-1 container mx-auto px-4 py-8">
              {children}
            </main>
            {/* Footer component will go here */}
            <ChatbotPopup /> {/* Add ChatbotPopup component */}
          </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
