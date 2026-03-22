export interface StoreSettings {
  id: string;
  store_name: string;
  store_description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  tax_rate?: number;
  currency: string;
  delivery_fee?: number;
  free_delivery_threshold?: number;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateStoreSettingsInput {
  store_name?: string;
  store_description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  tax_rate?: number;
  currency?: string;
  delivery_fee?: number;
  free_delivery_threshold?: number;
  logo_url?: string | null;
}
