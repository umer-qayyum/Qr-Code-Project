import { supabaseServerClient } from '@/lib/supabase/server';
import { Order } from '@/lib/types';
import OrdersTable from '@/components/OrdersTable';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — Gift Video Portal',
};

export const revalidate = 0;

async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabaseServerClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Order[];
}

export default async function DashboardPage() {
  const orders = await fetchOrders();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <OrdersTable initialOrders={orders} />
      </div>
    </main>
  );
}
