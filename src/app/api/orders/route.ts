import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase/server';
import { CreateOrderInput, Order } from '@/lib/types';

export async function GET(): Promise<NextResponse> {
  try {
    const { data, error } = await supabaseServerClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data as Order[] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateOrderInput;

    if (!body.customer_name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'customer_name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServerClient
      .from('orders')
      .insert({
        customer_name: body.customer_name.trim(),
        customer_note: body.customer_note?.trim() ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data as Order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
