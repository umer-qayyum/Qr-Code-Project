import { supabaseServerClient } from '@/lib/supabase/server';
import { Order } from '@/lib/types';
import type { Metadata } from 'next';

interface PageProps {
  params: { token: string };
}

async function fetchOrderByToken(token: string): Promise<Order | null> {
  const { data, error } = await supabaseServerClient
    .from('orders')
    .select('*')
    .eq('qr_token', token)
    .single();

  if (error) return null;
  return data as Order;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const order = await fetchOrderByToken(params.token);

  if (!order) {
    return { title: 'Gift Video' };
  }

  return {
    title: `A gift for ${order.customer_name}`,
    description: order.customer_note ?? 'A personal gift video just for you.',
  };
}

export default async function PublicVideoPage({ params }: PageProps) {
  const order = await fetchOrderByToken(params.token);

  if (!order || !order.video_url) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-6">🔗</div>
          <h1 className="text-2xl font-semibold text-white mb-3">This link is invalid</h1>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            The QR code you scanned doesn&apos;t match any gift video. Please check the code and try again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <p className="text-sm uppercase tracking-widest text-indigo-400 font-medium mb-2">
            You have a gift
          </p>
          <h1 className="text-3xl font-bold text-white">
            A gift for you, {order.customer_name.split(' ')[0]}
          </h1>
          {order.customer_note && (
            <p className="mt-3 text-gray-300 text-sm italic max-w-sm mx-auto">
              &ldquo;{order.customer_note}&rdquo;
            </p>
          )}
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl bg-black">
          <video
            src={order.video_url}
            controls
            autoPlay
            muted
            playsInline
            className="w-full"
            style={{ maxHeight: '70vh' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </main>
  );
}
