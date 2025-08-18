'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthErrorHandler() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let isHandlingError = false;

    const handleAuthError = async (errorMessage: string) => {
      if (isHandlingError) return;
      isHandlingError = true;

      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.warn('Error during sign out:', error);
      }

      router.push('/auth/login?message=Session expired. Please log in again.');
    };

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Token refresh failed
        await handleAuthError('Token refresh failed');
      }

      if (event === 'SIGNED_OUT') {
        isHandlingError = false; // Reset flag when signed out
      }
    });

    // Listen for unhandled promise rejections (auth errors)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || '';

      if (
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('Refresh Token Not Found') ||
        errorMessage.includes('AuthApiError')
      ) {
        event.preventDefault(); // Prevent the error from being logged to console
        handleAuthError(errorMessage);
      }
    };

    // Listen for general errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';

      if (
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('Refresh Token Not Found') ||
        errorMessage.includes('AuthApiError')
      ) {
        event.preventDefault();
        handleAuthError(errorMessage);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [router, supabase]);

  return null; // This component doesn't render anything
}
