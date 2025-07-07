import type {Metadata} from 'next';
import './globals.css';
import {SidebarProvider} from '@/components/ui/sidebar';
import {SiteHeader} from '@/components/site-header';
import {Toaster} from '@/components/ui/toaster';
import { ChatbotPopup } from '@/components/chatbot-popup';
import { DebugSession } from '@/components/debug-session';
import { DebugCookies } from '@/components/debug-cookies';
import { createClientServer } from '@/lib/supabaseClientServer'; // Import server client
import { SessionProvider } from '@/context/SessionProvider'; // Import SessionProvider

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

// Make layout async to fetch session on server
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch and validate session on the server
  const supabase = await createClientServer();
  let session = null;
  let user = null;

  try {
    // First authenticate the user securely
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error authenticating user:', userError);
    } else if (authUser) {
      user = authUser;
      // Get session only after successful authentication
      const { data: sessionData } = await supabase.auth.getSession();
      session = sessionData.session;
    }
  } catch (err) {
    console.error('Error in layout authentication:', err);
  }

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-honey-light text-foreground antialiased">
        {/* Wrap content with SessionProvider, passing the server session and user */}
        <SessionProvider serverSession={session} serverUser={user}>
          <DebugSession /> {/* Debug components can remain */}
          <DebugCookies />
          <SidebarProvider>
            <div className="flex flex-col min-h-screen w-full !max-w-none">
              <SiteHeader />
              <main className="flex-1 py-8 w-full !max-w-none">
                 {children}
                 {/* Footer component will go here */}
                 <ChatbotPopup /> {/* Add ChatbotPopup component */}
              </main> {/* Corrected: Removed duplicate closing tag */}
            </div>
          </SidebarProvider>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
