import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase/server';
import { deleteCloudinaryAsset } from '@/lib/cloudinary';
import { Order } from '@/lib/types';

interface RouteContext {
  params: { id: string };
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { data: order, error: fetchError } = await supabaseServerClient
      .from('orders')
      .select('video_url, qr_code_url')
      .eq('id', params.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Reset the order back to pending, clearing both video and QR
    const { error: updateError } = await supabaseServerClient
      .from('orders')
      .update({ video_url: null, qr_code_url: null, status: 'pending' })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // Best-effort Cloudinary cleanup
    const typedOrder = order as Pick<Order, 'video_url' | 'qr_code_url'>;
    if (typedOrder.video_url) {
      await deleteCloudinaryAsset(typedOrder.video_url, 'video');
    }
    if (typedOrder.qr_code_url) {
      await deleteCloudinaryAsset(typedOrder.qr_code_url, 'image');
    }

    return NextResponse.json({ success: true, data: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
