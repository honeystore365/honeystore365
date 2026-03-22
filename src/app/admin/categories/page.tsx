import { getCategories } from "@/lib/db";
import CategoriesClient from "@/components/CategoriesClient";

export default async function CategoriesPage() {
  const rows = await getCategories();
  const categories = rows.map((row: any) => ({
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || null,
    sort_order: (row.sort_order as number) || 0,
    created_at: row.created_at as string,
  }));

  return (
    <CategoriesClient initialCategories={categories} />
  );
}
