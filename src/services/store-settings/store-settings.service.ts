import { createClient } from '@/lib/supabase/client';
import type { StoreSettings, UpdateStoreSettingsInput } from './store-settings.types';
import { logInfo, logError } from '@/lib/logger';

export class StoreSettingsService {
  private supabase = createClient();

  async getSettings(): Promise<StoreSettings | null> {
    try {
      const { data, error } = await this.supabase
        .from('store_settings')
        .select('*')
        .single();

      if (error) {
        logError('StoreSettingsService.getSettings', { error: error.message });
        return null;
      }

      logInfo('StoreSettingsService.getSettings', { found: !!data });
      return data as StoreSettings;
    } catch (err) {
      logError('StoreSettingsService.getSettings', { err });
      return null;
    }
  }

  async updateSettings(input: UpdateStoreSettingsInput): Promise<StoreSettings | null> {
    try {
      const { data: existing } = await this.supabase
        .from('store_settings')
        .select('id')
        .single();

      if (!existing) {
        const { data, error } = await this.supabase
          .from('store_settings')
          .insert([input as any])
          .select()
          .single();

        if (error) {
          logError('StoreSettingsService.updateSettings (insert)', { error: error.message });
          return null;
        }

        logInfo('StoreSettingsService.updateSettings (insert)', { id: data.id });
        return data as StoreSettings;
      }

      const { data, error } = await this.supabase
        .from('store_settings')
        .update(input)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        logError('StoreSettingsService.updateSettings', { error: error.message });
        return null;
      }

      logInfo('StoreSettingsService.updateSettings', { id: data.id });
      return data as StoreSettings;
    } catch (err) {
      logError('StoreSettingsService.updateSettings', { err });
      return null;
    }
  }
}

export const storeSettingsService = new StoreSettingsService();
