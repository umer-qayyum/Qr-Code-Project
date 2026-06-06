import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseServerClient } from '@/lib/supabase/server';
import { Order } from '@/lib/types';
import VideoUploadForm from '@/components/VideoUploadForm';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import StatusBadge from '@/components/StatusBadge';
import type { Metadata } from 'next';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { data } = await supabaseServerClient
    .from('orders')
    .select('customer_name')
    .eq('id', params.id)
    .single();

  return {
    title: data
      ? `Order: ${data.customer_name} — Gift Video Portal`
      : 'Order — Gift Video Portal',
  };
}

async function fetchOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabaseServerClient
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Order;
}

export const revalidate = 0;

export default async function OrderDetailPage({ params }: PageProps) {
  const order = await fetchOrder(params.id);

  if (!order) notFound();

  const formattedDate = new Date(order.created_at).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{order.customer_name}</h1>
              {order.customer_note && (
                <p className="mt-1 text-sm text-gray-600 italic">"{order.customer_note}"</p>
              )}
            </div>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-400">Created {formattedDate}</p>
          <p className="text-xs text-gray-400 mt-1">Order ID: {order.id}</p>
        </div>

        <div className="space-y-6">
          <VideoUploadForm order={order} />
          <QRCodeDisplay order={order} />
        </div>
      </div>
    </main>
  );
}
