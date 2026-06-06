import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase/server';
import { deleteCloudinaryAsset } from '@/lib/cloudinary';
import { Order, UpdateOrderInput } from '@/lib/types';

interface RouteContext {
  params: { id: string };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { data, error } = await supabaseServerClient
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data as Order });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as UpdateOrderInput;

    const { data, error } = await supabaseServerClient
      .from('orders')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data as Order });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    // Fetch URLs first so we can clean up Cloudinary after DB deletion
    const { data: order, error: fetchError } = await supabaseServerClient
      .from('orders')
      .select('video_url, qr_code_url')
      .eq('id', params.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabaseServerClient
      .from('orders')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    // Best-effort Cloudinary cleanup — run after DB delete succeeds
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
