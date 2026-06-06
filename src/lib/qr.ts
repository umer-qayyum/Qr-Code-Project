import QRCode from 'qrcode';
import { uploadQrToCloudinary } from './cloudinary';

export async function generateAndUploadQr(
  orderId: string,
  qrToken: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const targetUrl = `${baseUrl}/v/${qrToken}`;

  const pngBuffer = await QRCode.toBuffer(targetUrl, {
    type: 'png',
    width: 400,
    errorCorrectionLevel: 'H',
    margin: 2,
  });

  const { secure_url } = await uploadQrToCloudinary(pngBuffer, orderId);
  return secure_url;
}
