// src/app/admin/categories/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
// Assurez-vous que '@/lib/supabaseClient' initialise un client Supabase
// adapté à l'utilisation côté client dans un composant 'use client'.
import { supabase } from '@/lib/supabaseClient';
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
import { Label } from '@/components/ui/label'; // Assurez-vous que ce composant existe
import { addCategory } from '@/actions/categoryActions'; // Import de l'action serveur

// Type pour les catégories
interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

// Définition des colonnes pour la DataTable
const categoryColumns = [
  {
    accessorKey: 'name',
    header: 'Name', // Peut-être traduire en arabe si l'interface est entièrement en arabe
  },
  {
    accessorKey: 'description',
    header: 'Description', // Peut-être traduire
  },
  // Vous pourriez ajouter une colonne pour les actions (modifier, supprimer) ici
];

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

  const formRef = useRef<HTMLFormElement>(null);

  // Fonction pour récupérer les catégories
  const fetchCategories = async () => {
    setLoading(true);
    // Vérifiez si supabase est correctement initialisé pour le client ici si nécessaire
    if (!supabase) {
      setError("Supabase client not initialized.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false }); // Optionnel: trier par date de création

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

      // Réinitialiser le formulaire et fermer le dialogue après un court délai pour montrer le succès
      setTimeout(() => {
        formRef.current?.reset(); // Vider le formulaire
        // setNewCategoryName(''); // Non nécessaire si on utilise FormData et reset()
        // setNewCategoryDescription(''); // Non nécessaire
        setIsDialogOpen(false); // Fermer le dialogue
        setAddSuccess(false); // Masquer le message de succès
        fetchCategories(); // Rafraîchir la liste des catégories après l'ajout
      }, 1500); // Délai court pour que l'utilisateur voit le message de succès

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
              <DialogClose asChild>
<Button type="button" variant="outline" disabled={isSubmitting}> {/* Désactiver pendant la soumission */}
<span>إلغاء</span> {/* Wrapped text in span */}
</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الإضافة...' : 'إضافة الفئة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
    // </AdminLayout> {/* Décommentez si vous utilisez un layout ici */}
  );
}