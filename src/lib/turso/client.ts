import { createClient } from '@libsql/client';

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://honeystore-belloumi.aws-us-east-1.turso.io';
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

export const db = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          created_at: string;
          password_hash: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          created_at?: string;
          password_hash: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          created_at?: string;
          password_hash?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          customer_id: string;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          stock: number;
          image_url: string | null;
          is_available: number;
          weight: string | null;
          origin: string | null;
          category_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          stock?: number;
          image_url?: string | null;
          is_available?: number;
          weight?: string | null;
          origin?: string | null;
          category_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          stock?: number;
          image_url?: string | null;
          is_available?: number;
          weight?: string | null;
          origin?: string | null;
          category_id?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          sort_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number | null;
          created_at?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          created_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          customer_id: string;
          product_id: string | null;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_id?: string | null;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          product_id?: string | null;
          quantity?: number;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          customer_email: string | null;
          shipping_address: string | null;
          city: string | null;
          total_amount: number;
          status: string;
          payment_method: string | null;
          notes: string | null;
          ordered_at: string;
          confirmed_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          shipping_address?: string | null;
          city?: string | null;
          total_amount: number;
          status?: string;
          payment_method?: string | null;
          notes?: string | null;
          ordered_at?: string;
          confirmed_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          shipping_address?: string | null;
          city?: string | null;
          total_amount?: number;
          status?: string;
          payment_method?: string | null;
          notes?: string | null;
          ordered_at?: string;
          confirmed_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          product_id: string | null;
          product_name: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          product_name?: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          product_name?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
        };
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string | null;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          is_default: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          is_default?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          is_default?: number | null;
          created_at?: string;
        };
      };
      store_settings: {
        Row: {
          id: string;
          store_name: string;
          store_description: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          tax_rate: number | null;
          currency: string | null;
          delivery_fee: number | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_name: string;
          store_description?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          tax_rate?: number | null;
          currency?: string | null;
          delivery_fee?: number | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_name?: string;
          store_description?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          tax_rate?: number | null;
          currency?: string | null;
          delivery_fee?: number | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_categories: {
        Row: {
          product_id: string;
          category_id: string;
        };
        Insert: {
          product_id: string;
          category_id: string;
        };
        Update: {
          product_id?: string;
          category_id?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string | null;
          image_url: string;
          sort_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          image_url: string;
          sort_order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          image_url?: string;
          sort_order?: number | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          website: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          website?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          website?: string | null;
          updated_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string | null;
          customer_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          customer_id?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          customer_id?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      wishlists: {
        Row: {
          id: string;
          customer_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          created_at?: string;
        };
      };
      wishlist_items: {
        Row: {
          id: string;
          wishlist_id: string | null;
          product_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wishlist_id?: string | null;
          product_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wishlist_id?: string | null;
          product_id?: string | null;
          created_at?: string;
        };
      };
      email_verifications: {
        Row: {
          id: string;
          customer_id: string;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      password_resets: {
        Row: {
          id: string;
          customer_id: string;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      password_reset_codes: {
        Row: {
          id: string;
          customer_id: string;
          code: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          code: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          code?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
    };
  };
};
