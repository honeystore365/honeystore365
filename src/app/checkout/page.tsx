import { getCartItems } from '@/actions/cartActions';
import { getCustomerDetailsForCheckout } from '@/actions/checkoutActions';
import CheckoutClient from '@/components/CheckoutClient';
import { createClientServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ method?: string }> }) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  // If not authenticated, show a simple message (you may want to redirect to login)
  if (!user) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">الرجاء تسجيل الدخول لإتمام الشراء</h1>
      </div>
    );
  }

  // Load cart
  const { items, subtotal, shipping } = await getCartItems();

  // Load customer + address
  const customerResult = await getCustomerDetailsForCheckout(user.id);
  const customer = customerResult.success ? (customerResult as any).data.customer : null;
  const address = customerResult.success ? (customerResult as any).data.address : null;

  // Initial payment method from query or default (await the promise per Next.js 15)
  const sp = await searchParams;
  const methodParam = (sp?.method || 'cash_on_delivery') as 'cash_on_delivery' | 'mobile_payment' | 'bank_transfer' | 'paypal';

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">إتمام الشراء</h1>
      <CheckoutClient
        items={items}
        total={subtotal ?? 0}
        customer={customer}
        address={address}
        deliveryFee={shipping ?? 0}
        initialPaymentMethod={methodParam}
      />
    </div>
  );
}

