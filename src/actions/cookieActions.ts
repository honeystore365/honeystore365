'use server';

import { cookies } from 'next/headers';

export async function getRecentOrdersCookie() {
  const cookieStore = await cookies();
  const cachedOrders = cookieStore.get('recentOrders')?.value;
  return cachedOrders;
}
