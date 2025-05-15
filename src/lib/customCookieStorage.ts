import * as AuthHelpers from '@supabase/auth-helpers-shared';
// Assuming AuthStorage is available as AuthHelpers.AuthStorage or similar

class CustomCookieStorage implements AuthStorage {
  async getItem(key: string): Promise<string | null> {
    console.log(`[CustomCookieStorage] Attempting to get item for key: "${key}"`);
    // Directly access browser cookies
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${key}=`))
      ?.split('=')[1];

    if (!cookieValue) {
      console.log(`[CustomCookieStorage] No cookie value found for key: "${key}"`);
      return null;
    }

    console.log(`[CustomCookieStorage] Found cookie value for key "${key}":`, cookieValue);

    // Check if the value has the 'base64-' prefix
    if (cookieValue.startsWith('base64-')) {
      try {
        const base64EncodedJson = cookieValue.substring('base64-'.length);
        console.log(`[CustomCookieStorage] Decoding base64 for key "${key}":`, base64EncodedJson);
        const decodedJsonString = atob(base64EncodedJson);
        console.log(`[CustomCookieStorage] Decoded string for key "${key}":`, decodedJsonString);

        // Before returning, check if the decoded string is valid JSON
        try {
          JSON.parse(decodedJsonString);
          console.log(`[CustomCookieStorage] Successfully decoded and parsed cookie for key "${key}"`);
          return decodedJsonString;
        } catch (jsonError) {
          console.error(`[CustomCookieStorage] Decoded string for key "${key}" is not valid JSON:`, decodedJsonString, jsonError);
          return null;
        }
      } catch (e) {
        console.error(`[CustomCookieStorage] Failed to decode base64 cookie value for key "${key}":`, cookieValue, e);
        return null;
      }
    }

    // If no prefix, return the original value.
    console.log(`[CustomCookieStorage] Returning non-base64 cookie value for key "${key}"`);
    return cookieValue;
  }

  async setItem(key: string, value: string): Promise<void> {
    console.log(`[CustomCookieStorage] Setting item for key "${key}" with value:`, value);
    // Basic setItem implementation
    document.cookie = `${key}=${value}; path=/; Secure; SameSite=Strict`;
  }

  async removeItem(key: string): Promise<void> {
    console.log(`[CustomCookieStorage] Removing item for key: "${key}"`);
    // Basic removeItem implementation
    document.cookie = `${key}=; Max-Age=-99999999; path=/`;
  }
}

// Export an instance of the custom storage adapter
export const customCookieStorage = new CustomCookieStorage();