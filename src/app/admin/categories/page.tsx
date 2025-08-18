// src/app/admin/categories/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
// Assurez-vous que '@/lib/supabase/client' initialise un client Supabase
// adapté à l'utilisation côté client dans un composant 'use client'.
import { createClientComponent } from '@/lib/supabase/client';
import { DataTable } from '@/components/data-table'; // Assurez-vous que ce composant existe
// import AdminLayout from '../layout'; // Commenté si le layout est géré au niveau du dossier
import { Button } from '@/components/ui/button'; // Assurez-vous que ce composant existe
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'; // Assurez-vous que ces composants existent
import { Input } from '@/components/ui/input'; // Assurez-vous que ce composant existe
import { Label } from '@/components/ui/label';
import { addCategory } from '@/actions/categoryActions';
import { Row } from '@tanstack/react-table'; // Import Row type for actions column
import { ConfirmationModal } from '@/components/confirmation-modal'; // Import confirmation modal
// Link component might be needed for Edit button later
// import Link from 'next/link';

// Type pour les catégories
interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

// Définition des colonnes pour la DataTable (outside component to avoid redefining on re-render if fetchCategories isn't needed inside)
// Note: If actions need fetchCategories, columns must be defined inside CategoriesPage
// Let's define it inside for now to access fetchCategories in handleDelete
// const categoryColumns = [ ... ]; // Moved inside component

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Lorsque vous utilisez FormData avec les actions serveur,
  // maintenir l'état local des inputs n'est pas strictement nécessaire pour la soumission.
  // Cependant, cela peut être utile pour vider le formulaire après coup.
  // const [newCategoryName, setNewCategoryName] = useState('');
  // const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null); // Erreur spécifique à l'ajout
  const [addSuccess, setAddSuccess] = useState<boolean>(false); // Succès de l'ajout
  const [editingCategory, setEditingCategory] = useState<Category | null>(null); // State for category being edited
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State for edit dialog

  const formRef = useRef<HTMLFormElement>(null); // Ref for add form
  const editFormRef = useRef<HTMLFormElement>(null); // Ref for edit form

  // Fonction pour récupérer les catégories
  const fetchCategories = async () => {
    setLoading(true);
// Vérifiez si supabase est correctement initialisé pour le client ici si nécessaire
const supabase = createClientComponent();
const { data, error } = await supabase
.from('categories')
.select('*')
.order('created_at', { ascending: false }); // Optionnel: trier par date de création

console.log('Fetch categories result - data:', data);
console.log('Fetch categories result - error:', error);

if (error) {
console.error('Error fetching categories:', error);
      setError(error.message);
      setCategories([]);
    } else {
      setCategories(data as Category[]);
      setError(null);
    }
    setLoading(false);
  };

  // Exécuter la récupération au montage du composant
  useEffect(() => {
    fetchCategories();
  }, []); // Le tableau vide assure que cela ne s'exécute qu'une fois au montage

  // Define columns inside the component to access fetchCategories
  const categoryColumns = [
    {
      accessorKey: 'name',
      header: 'الاسم', // Translated to Arabic
    },
    {
      accessorKey: 'description',
      header: 'الوصف', // Translated to Arabic
    },
    {
      id: 'actions',
      header: 'إجراءات', // Actions header in Arabic
      cell: ({ row }: { row: Row<Category> }) => {
        const category = row.original;
        const [isDeleting, setIsDeleting] = useState(false);
        // Need access to fetchCategories to refresh list after delete
        // This closure will capture fetchCategories from the outer scope

        const handleDelete = async () => {
          setIsDeleting(true);
          const supabase = createClientComponent();
          const { error: deleteError } = await supabase
            .from('categories')
            .delete()
            .eq('id', category.id);

          if (deleteError) {
            console.error('Error deleting category:', deleteError);
            // Optionally show an error message to the user
            alert(`Error deleting category: ${deleteError.message}`); // Simple alert for now
            setIsDeleting(false);
            return false; // Indicate failure
          }

          // Refresh the category list
          await fetchCategories(); // Call fetchCategories from parent scope
          setIsDeleting(false);
          return true; // Indicate success
        };

        const handleEditClick = () => {
          setEditingCategory(category);
          setIsEditDialogOpen(true);
          // Reset add dialog errors/success if reusing the same dialog state (better to use separate state)
          setAddError(null);
          setAddSuccess(false);
        };

        return (
          <div className="flex items-center gap-2">
            {/* Edit Button - Opens Edit Dialog */}
            <Button variant="outline" size="sm" onClick={handleEditClick}>
              تعديل {/* Edit */}
            </Button>
            <ConfirmationModal
              title="حذف الفئة" // Delete Category title
              description="هل أنت متأكد أنك تريد حذف هذه الفئة؟ لا يمكن التراجع عن هذا الإجراء." // Confirmation message
              onConfirm={handleDelete}
              confirmText="حذف" // Delete button text
              cancelText="إلغاء" // Cancel button text
            >
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                {isDeleting ? 'جاري الحذف...' : 'حذف'} {/* Delete / Deleting... */}
              </Button>
            </ConfirmationModal>
          </div>
        );
      },
    },
  ];

  // Handler pour la soumission du formulaire via l'action serveur
  const handleAddCategory = async (formData: FormData) => {
    setIsSubmitting(true);
    setAddError(null); // Réinitialiser l'erreur d'ajout précédente
    setAddSuccess(false); // Réinitialiser le succès précédent

    const result = await addCategory(formData); // Appel de l'action serveur

    if (result?.error) {
      console.error('Error adding category:', result.error);
      setAddError(result.error); // Afficher l'erreur dans le dialogue
      // alert('Error adding category: ' + result.error); // Éviter les alertes intrusives
    } else {
      console.log('Category added:', result?.category);
      setAddSuccess(true); // Indiquer le succès

      // Réinitialiser le formulaire et fermer le dialogue (removed setTimeout)
      formRef.current?.reset(); // Vider le formulaire
      setIsDialogOpen(false); // Fermer le dialogue
      setAddSuccess(false); // Reset success state (or keep true briefly if desired)
      fetchCategories(); // Rafraîchir la liste des catégories après l'ajout

    }
    setIsSubmitting(false);
  };

  // Handler for the edit form submission
  const handleUpdateCategory = async (formData: FormData) => {
    if (!editingCategory) return; // Should not happen if dialog is open

    setIsSubmitting(true);
    setAddError(null); // Use the same error state for simplicity, or create a separate one
    setAddSuccess(false);

    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;

    // Basic validation (can be enhanced)
    if (!name || name.trim() === '') {
        setAddError('اسم الفئة مطلوب.'); // Category name is required.
        setIsSubmitting(false);
        return;
    }

    const supabase = createClientComponent();
    const { error: updateError } = await supabase
      .from('categories')
      .update({ name: name.trim(), description: description?.trim() || null })
      .eq('id', editingCategory.id);

    if (updateError) {
      console.error('Error updating category:', updateError);
      setAddError(updateError.message);
    } else {
      console.log('Category updated:', editingCategory.id);
      setAddSuccess(true); // Indicate success

      // Close dialog and refresh immediately (removed setTimeout)
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      setAddSuccess(false); // Reset success state
      fetchCategories();
    }

    setIsSubmitting(false);
  };


  return (
    // <AdminLayout> {/* Décommentez si vous utilisez un layout ici */}
    <>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">الفئات</h1>
          {/* Utilisez un état pour gérer l'ouverture du dialogue */}
          <Button onClick={() => {
            setIsDialogOpen(true);
            setAddError(null); // Réinitialiser l'erreur à l'ouverture
            setAddSuccess(false); // Réinitialiser le succès à l'ouverture
          }}>
            إضافة فئة جديدة
          </Button>
        </div>

        {/* Affichage des messages de chargement ou d'erreur pour la liste principale */}
        {loading && <div className="text-center">جاري تحميل الفئات...</div>}
        {error && <div className="text-center text-red-500">خطأ في تحميل الفئات: {error}</div>}
        {/* Affichage de la table si pas en chargement et pas d'erreur */}
        {!loading && !error && categories.length > 0 && (
          <DataTable columns={categoryColumns} data={categories} />
        )}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center">لا توجد فئات حالياً.</div>
        )}
      </div>

      {/* Dialogue pour l'ajout de catégorie */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة فئة جديدة</DialogTitle>
            <DialogDescription>
              املأ التفاصيل للفئة الجديدة.
            </DialogDescription>
          </DialogHeader>
          {/* Le formulaire utilise l'attribut 'action' pour l'action serveur */}
          <form ref={formRef} action={handleAddCategory}>
            <div className="grid gap-4 py-4">
              {/* Afficher l'erreur d'ajout spécifique ici */}
              {addError && <p className="text-red-500 text-sm">{addError}</p>}
              {/* Afficher le message de succès ici */}
              {addSuccess && <p className="text-green-600 text-sm">الفئة تمت إضافتها بنجاح!</p>}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  الاسم
                </Label>
                <Input
                  id="name"
                  name="name" // Le nom est important pour FormData
                  // value={newCategoryName} // Pas nécessaire si on utilise FormData et reset()
                  // onChange={(e) => setNewCategoryName(e.target.value)} // Pas nécessaire
                  className="col-span-3 text-right"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  الوصف
                </Label>
                <Input
                  id="description"
                  name="description" // Le nom est important pour FormData
                  // value={newCategoryDescription} // Pas nécessaire
                  // onChange={(e) => setNewCategoryDescription(e.target.value)} // Pas nécessaire
                  className="col-span-3 text-right"
                />
              </div>
            </div>
            <DialogFooter>
<Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}> {/* Désactiver pendant la soumission */}
إلغاء
</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الإضافة...' : 'إضافة الفئة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour la modification de catégorie */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الفئة</DialogTitle>
            <DialogDescription>
              قم بتحديث تفاصيل الفئة.
            </DialogDescription>
          </DialogHeader>
          <form ref={editFormRef} action={handleUpdateCategory}>
            <div className="grid gap-4 py-4">
              {/* Afficher l'erreur d'ajout/modification ici */}
              {addError && <p className="text-red-500 text-sm">{addError}</p>}
              {/* Afficher le message de succès ici */}
              {addSuccess && <p className="text-green-600 text-sm">تم تحديث الفئة بنجاح!</p>}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  الاسم
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingCategory?.name || ''} // Pre-fill with current name
                  className="col-span-3 text-right"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  الوصف
                </Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={editingCategory?.description || ''} // Pre-fill with current description
                  className="col-span-3 text-right"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري التحديث...' : 'تحديث الفئة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
    // </AdminLayout> {/* Décommentez si vous utilisez un layout ici */}
  );
}
