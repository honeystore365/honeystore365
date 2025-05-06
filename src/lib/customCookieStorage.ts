import { type AuthStorage } from '@supabase/auth-helpers-shared';

class CustomCookieStorage implements AuthStorage {
  async getItem(key: string): Promise<string | null> {
    // Directly access browser cookies
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${key}=`))
      ?.split('=')[1];

    if (!cookieValue) {
      return null;
    }

    // Check if the value has the 'base64-' prefix
    if (cookieValue.startsWith('base64-')) {
      try {
        const base64EncodedJson = cookieValue.substring('base64-'.length);
        const decodedJsonString = atob(base64EncodedJson);
        // Return the decoded string. The Supabase client will handle JSON.parse.
        return decodedJsonString;
      } catch (e) {
        console.error('Failed to decode base64 cookie value:', e);
        return null;
      }
    }

    // If no prefix, return the original value.
    return cookieValue;
  }

  async setItem(key: string, value: string): Promise<void> {
    // Basic setItem implementation
    document.cookie = `${key}=${value}; path=/; Secure; SameSite=Strict`;
  }

  async removeItem(key: string): Promise<void> {
    // Basic removeItem implementation
    document.cookie = `${key}=; Max-Age=-99999999; path=/`;
  }
}

// Export an instance of the custom storage adapter
export const customCookieStorage = new CustomCookieStorage();