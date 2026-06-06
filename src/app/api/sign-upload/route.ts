import { NextResponse } from 'next/server';
import crypto from 'crypto';

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
}

/**
 * Generates a Cloudinary upload signature using the same algorithm as
 * cloudinary.utils.api_sign_request: SHA-1( sorted_params + api_secret ).
 * Using Node crypto directly avoids loading the full Cloudinary SDK here.
 */
function signCloudinaryUpload(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
}

export async function POST(): Promise<NextResponse> {
  try {
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!apiSecret || !apiKey || !cloudName) {
      return NextResponse.json(
        { success: false, error: 'Cloudinary environment variables are not configured' },
        { status: 500 }
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'gift-videos';

    const signature = signCloudinaryUpload({ folder, timestamp }, apiSecret);

    const payload: CloudinarySignature = {
      signature,
      timestamp,
      api_key: apiKey,
      cloud_name: cloudName,
      folder,
    };

    return NextResponse.json({ success: true, data: payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate upload signature';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
