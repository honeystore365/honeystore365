import { getCartItems } from '@/actions/cartActions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CartDisplayClient from '@/components/CartDisplayClient'; // Import the main client component
import PdfList from '@/components/PdfList';

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

// Keep types here or move to shared location

interface CartProduct {
  id: string;
  name: string | null;
  price: number | null;
  image_url: string | null;
  description: string | null;
}

interface CartPageItem {
  id: string; // This is the cart_item_id
  quantity: number;
  product: CartProduct | null;
}

export default async function CartPage() {
  console.log('[CartPage] Fetching cart items...');
  const { items, total, error: cartError } = await getCartItems();
  console.log('[CartPage] Fetched cart items:', items);
  console.log('[CartPage] Fetched cart total:', total);
  console.log('[CartPage] Cart fetch error:', cartError);

  if (cartError) {
    console.error('[CartPage] Error fetching cart:', cartError);
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-8 text-destructive">خطأ في تحميل السلة</h1>
        <p className="text-lg text-muted-foreground">{cartError}</p>
        <Button asChild className="mt-6">
          <Link href="/">العودة للرئيسية</Link>
        </Button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    console.log('[CartPage] Cart is empty.');
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-8 text-honey-dark">سلة التسوق فارغة</h1>
        <p className="text-lg text-muted-foreground mb-6">
          لم تقم بإضافة أي منتجات إلى سلتك بعد.
        </p>
        <Button asChild size="lg" className="bg-honey hover:bg-honey-dark text-white">
          <Link href="/products">تصفح المنتجات</Link>
        </Button>
      </div>
    );
  }

  console.log('[CartPage] Rendering CartDisplayClient with items and total.');
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-extrabold mb-10 text-center text-honey-dark tracking-tight">
        سلة التسوق الخاصة بك
      </h1>
      {/* Delegate rendering and client-side state management to CartDisplayClient */}
      <CartDisplayClient initialItems={items} initialTotal={total} />
      <PdfList />
    </div>
  );
}
