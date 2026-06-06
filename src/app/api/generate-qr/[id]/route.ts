import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase/server';
import { generateAndUploadQr } from '@/lib/qr';
import { Order } from '@/lib/types';

interface RouteContext {
  params: { id: string };
}

export async function POST(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { data: order, error: fetchError } = await supabaseServerClient
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const typedOrder = order as Order;

    if (!typedOrder.video_url) {
      return NextResponse.json(
        { success: false, error: 'Video must be uploaded before generating QR code' },
        { status: 400 }
      );
    }

    const qrCodeUrl = await generateAndUploadQr(params.id, typedOrder.qr_token);

    const { error: updateError } = await supabaseServerClient
      .from('orders')
      .update({ qr_code_url: qrCodeUrl, status: 'qr_generated' })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { qr_code_url: qrCodeUrl } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
