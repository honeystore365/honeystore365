/**
 * Utility to handle corrupted auth tokens and clean up invalid sessions
 */

import { logger } from '@/lib/logger';
import { createClientComponent } from '@/lib/supabaseClient';

export async function cleanupCorruptedTokens(): Promise<void> {
  try {
    const supabase = createClientComponent();
    
    // Sign out to clear any corrupted tokens
    await supabase.auth.signOut();
    
    // Clear any remaining auth-related items from localStorage
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear cookies related to auth
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.startsWith('sb-') || name.includes('supabase')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    }
    
    logger.info('Auth tokens cleaned up successfully');
  } catch (error) {
    logger.error('Failed to cleanup corrupted tokens', error as Error);
  }
}

export function isAuthTokenError(error: any): boolean {
  return (
    error?.message?.includes('Invalid Refresh Token') ||
    error?.message?.includes('Refresh Token Not Found') ||
    error?.message?.includes('JWT expired') ||
    error?.code === 'invalid_token'
  );
}