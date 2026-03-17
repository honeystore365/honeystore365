"use client";

import { db } from "@/lib/db";
import { id, InstaQLEntity } from "@instantdb/react";
import { type AppSchema } from "@/instant.schema";
import { useState } from "react";
import { Plus, Edit2, Trash2, Package, Search, Eye, EyeOff } from "lucide-react";

type Product = InstaQLEntity<AppSchema, "products">;
type Category = InstaQLEntity<AppSchema, "categories">;

// Helper to format price from millimes to DT
const formatPrice = (millimes: number) => (millimes / 1000).toFixed(2);

export default function AdminProductsPage() {
  // Real-time query - automatically updates when data changes!
  const { isLoading, error, data } = db.useQuery({
    products: {
      $: {
        order: { createdAt: "desc" },
      },
      categories: {
        category: {},
      },
    },
    categories: {},
  });

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Erreur: {error.message}
      </div>
    );
  }

  const { products, categories } = data;

  // Filter products by search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Produits</h1>
          <p className="text-gray-500 mt-1">
            {products.length} produits en catalogue
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter un produit
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categories={categories}
            onEdit={() => setEditingProduct(product)}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun produit trouvé</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingProduct) && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

// Product Card Component
function ProductCard({
  product,
  categories,
  onEdit,
}: {
  product: Product;
  categories: Category[];
  onEdit: () => void;
}) {
  const toggleAvailability = () => {
    db.transact(
      db.tx.products[product.id].update({
        isAvailable: !product.isAvailable,
      })
    );
  };

  const deleteProduct = () => {
    if (confirm(`Supprimer "${product.name}" ?`)) {
      db.transact(db.tx.products[product.id].delete());
    }
  };

  // Get category names
  const productCategories = product.categories || [];
  const categoryNames = productCategories
    .map((pc: any) => pc.category?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${!product.isAvailable ? "opacity-60" : ""}`}>
      <div className="aspect-square bg-gray-100 relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        )}
        <button
          onClick={toggleAvailability}
          className="absolute top-2 left-2 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
        >
          {product.isAvailable ? (
            <Eye className="w-4 h-4 text-green-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{product.name}</h3>
          <span className="text-lg font-bold text-amber-600">
            {formatPrice(product.price)} DT
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {product.description || "Pas de description"}
        </p>

        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-500">
            Stock: <span className="font-medium">{product.stock}</span>
          </span>
          {categoryNames && (
            <span className="text-amber-600">{categoryNames}</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={deleteProduct}
            className="p-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Product Modal (Add/Edit)
function ProductModal({
  product,
  categories,
  onClose,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
})

{
  const isEditing = !!product;
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product ? formatPrice(product.price) : "",
    stock: product?.stock?.toString() || "0",
    imageUrl: product?.imageUrl || "",
    isAvailable: product?.isAvailable ?? true,
    weight: product?.weight || "",
    origin: product?.origin || "",
    selectedCategories: product?.categories?.map((c: any) => c.category?.id) || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceInMillimes = Math.round(parseFloat(formData.price) * 1000);
    const now = Date.now();

    if (isEditing && product) {
      // Update existing product
      db.transact(
        db.tx.products[product.id].update({
          name: formData.name,
          description: formData.description,
          price: priceInMillimes,
          stock: parseInt(formData.stock),
          imageUrl: formData.imageUrl,
          isAvailable: formData.isAvailable,
          weight: formData.weight,
          origin: formData.origin,
          updatedAt: now,
        })
      );

      // Note: Category management would require deleting old links and creating new ones
      // Simplified for this demo
    } else {
      // Create new product
      const productId = id();
      db.transact(
        db.tx.products[productId].create({
          name: formData.name,
          description: formData.description,
          price: priceInMillimes,
          stock: parseInt(formData.stock),
          imageUrl: formData.imageUrl,
          isAvailable: formData.isAvailable,
          weight: formData.weight,
          origin: formData.origin,
          createdAt: now,
          updatedAt: now,
        })
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">
            {isEditing ? "Modifier le produit" : "Ajouter un produit"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du produit *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="ex: Miel de fleurs 500g"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Description du produit..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix (DT) *
              </label>
              <input
                type="number"
                step="0.001"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="25.000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock *
              </label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poids
              </label>
              <input
                type="text"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="500g, 1kg..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origine
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) =>
                  setFormData({ ...formData, origin: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Tunisie, Arabie..."
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de l'image
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailable: e.target.checked })
                  }
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Disponible à la vente
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              {isEditing ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
