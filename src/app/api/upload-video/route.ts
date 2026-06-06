import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase/server';

interface SaveVideoBody {
  orderId: string;
  video_url: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Guard against non-JSON bodies (e.g. old multipart/form-data requests)
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Expected Content-Type: application/json. ' +
          'Video uploads now go directly to Cloudinary — make sure you are running the latest client code.',
      },
      { status: 415 }
    );
  }

  let body: Partial<SaveVideoBody>;
  try {
    body = (await request.json()) as Partial<SaveVideoBody>;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Request body is not valid JSON' },
      { status: 400 }
    );
  }

  try {
    if (!body.orderId || typeof body.orderId !== 'string') {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    if (!body.video_url || typeof body.video_url !== 'string') {
      return NextResponse.json({ success: false, error: 'video_url is required' }, { status: 400 });
    }

    if (!body.video_url.startsWith('https://res.cloudinary.com/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid video URL — must be a Cloudinary URL' },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabaseServerClient
      .from('orders')
      .select('id')
      .eq('id', body.orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const { error: updateError } = await supabaseServerClient
      .from('orders')
      .update({ video_url: body.video_url, status: 'video_uploaded' })
      .eq('id', body.orderId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { video_url: body.video_url } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
