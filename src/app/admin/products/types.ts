export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id?: string;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  categories?: {
    id: string;
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  is_available: boolean;
}

export const emptyProductForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  category_id: 'no-category',
  image_url: '',
  is_available: true,
};
