'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Package, Plus } from 'lucide-react';
import { useState } from 'react';
import { ProductCard } from './components/ProductCard';
import { ProductForm } from './components/ProductForm';
import { useProducts } from './useProducts';
import { emptyProductForm, type ProductFormData } from './types';

export default function ProductsClientPage() {
  const { products, categories, loading, savingProduct, addProduct, updateProduct, deleteProduct } = useProducts();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProductForm, setNewProductForm] = useState<ProductFormData>(emptyProductForm);
  const [editForm, setEditForm] = useState<ProductFormData>(emptyProductForm);

  const handleStartEdit = (product: typeof products[0]) => {
    setEditingProductId(product.id);
    setEditForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category_id: product.category_id || 'no-category',
      image_url: product.image_url || '',
      is_available: product.is_available,
    });
  };

  const handleCancelAdd = () => {
    setIsAddingProduct(false);
    setNewProductForm(emptyProductForm);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditForm(emptyProductForm);
  };

  const handleAdd = async () => {
    const success = await addProduct(newProductForm);
    if (success) handleCancelAdd();
  };

  const handleUpdate = async (productId: string) => {
    const success = await updateProduct(productId, editForm);
    if (success) setEditingProductId(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">جاري تحميل المنتجات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2 flex items-center gap-3">
          <Package className="h-8 w-8" />
          إدارة المنتجات
        </h1>
        <p className="text-gray-600">إدارة منتجات المتجر والفئات</p>
      </div>

      {/* Add Product Section */}
      <div className="mb-6">
        {!isAddingProduct ? (
          <Button onClick={() => setIsAddingProduct(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            إضافة منتج جديد
          </Button>
        ) : (
          <ProductForm
            mode="add"
            formData={newProductForm}
            onChange={setNewProductForm}
            onSubmit={handleAdd}
            onCancel={handleCancelAdd}
            saving={savingProduct === 'new'}
            categories={categories}
          />
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-600">ابدأ بإضافة منتج جديد</p>
          </div>
        ) : (
          products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isEditing={editingProductId === product.id}
              editForm={editForm}
              onEditChange={setEditForm}
              onStartEdit={() => handleStartEdit(product)}
              onCancelEdit={handleCancelEdit}
              onSave={() => handleUpdate(product.id)}
              onDelete={() => deleteProduct(product.id, product.name)}
              saving={savingProduct === product.id}
              categories={categories}
            />
          ))
        )}
      </div>
    </div>
  );
}
