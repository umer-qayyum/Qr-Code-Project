import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase/server';
import { uploadVideoToCloudinary } from '@/lib/cloudinary';

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const orderId = formData.get('orderId');

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: 'file is required' }, { status: 400 });
    }

    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { success: false, error: 'File must be a video' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File exceeds 100 MB limit' },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabaseServerClient
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = file instanceof File ? file.name : 'upload.mp4';

    const { secure_url } = await uploadVideoToCloudinary(buffer, filename);

    const { error: updateError } = await supabaseServerClient
      .from('orders')
      .update({ video_url: secure_url, status: 'video_uploaded' })
      .eq('id', orderId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { video_url: secure_url } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
