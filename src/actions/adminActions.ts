'use server';

import { cookies } from 'next/headers';
import CircularJSON from 'circular-json';

console.log("adminActions.ts: supabaseClientServerOnly import successful");

export async function setRecentOrdersCookie(orders: any) {
  (await cookies()).set('recentOrders', CircularJSON.stringify(orders));
}