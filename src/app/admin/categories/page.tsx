"use client";

import { db } from "@/lib/db";
import { id, InstaQLEntity } from "@instantdb/react";
import { type AppSchema } from "@/instant.schema";
import { useState } from "react";
import { Plus, Edit2, Trash2, Tag } from "lucide-react";

type Category = InstaQLEntity<AppSchema, "categories">;

export default function AdminCategoriesPage() {
  const { isLoading, error, data } = db.useQuery({
    categories: {
      $: {
        order: { sortOrder: "asc" },
      },
    },
  });

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

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

  const { categories } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-gray-500 mt-1">
            {categories.length} catégorie(s) configurée(s)
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter une catégorie
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={() => {
              setEditingCategory(category);
              setShowModal(true);
            }}
          />
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune catégorie configurée</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function CategoryCard({
  category,
  onEdit,
}: {
  category: Category;
  onEdit: () => void;
}) {
  const deleteCategory = () => {
    if (confirm(`Supprimer la catégorie "${category.name}" ?`)) {
      db.transact(db.tx.categories[category.id].delete());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Tag className="w-6 h-6 text-amber-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-500">
              Ordre: {category.sortOrder || 0}
            </p>
          </div>
        </div>
      </div>

      <p className="text-gray-600 mt-4 line-clamp-2">
        {category.description || "Pas de description"}
      </p>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Modifier
        </button>
        <button
          onClick={deleteCategory}
          className="p-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CategoryModal({
  category,
  onClose,
}: {
  category: Category | null;
  onClose: () => void;
}) {
  const isEditing = !!category;
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    imageUrl: category?.imageUrl || "",
    sortOrder: category?.sortOrder?.toString() || "0",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && category) {
      db.transact(
        db.tx.categories[category.id].update({
          name: formData.name,
          description: formData.description,
          imageUrl: formData.imageUrl,
          sortOrder: parseInt(formData.sortOrder) || 0,
        })
      );
    } else {
      const categoryId = id();
      db.transact(
        db.tx.categories[categoryId].create({
          name: formData.name,
          description: formData.description,
          imageUrl: formData.imageUrl,
          sortOrder: parseInt(formData.sortOrder) || 0,
        })
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">
            {isEditing ? "Modifier la catégorie" : "Ajouter une catégorie"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="ex: Miels tunisiens"
            />
          </div>

          <div>
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
              placeholder="Description de la catégorie..."
            />
          </div>

          <div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordre d'affichage
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData({ ...formData, sortOrder: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="0"
            />
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
