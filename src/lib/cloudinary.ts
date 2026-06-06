import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export async function uploadVideoToCloudinary(
  buffer: Buffer,
  filename: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'gift-videos',
        resource_type: 'video',
        public_id: `video_${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function uploadQrToCloudinary(
  pngBuffer: Buffer,
  orderId: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'qr-codes',
        resource_type: 'image',
        public_id: `qr_${orderId}`,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary QR upload failed'));
          return;
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(pngBuffer);
  });
}

/**
 * Extracts the Cloudinary public_id from a secure URL.
 * URL format: https://res.cloudinary.com/{cloud}/{type}/upload/v{ver}/{public_id}.{ext}
 */
function extractPublicId(url: string): string {
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return '';
    const afterUpload = parts[1];
    // Strip optional version segment (v1234567890/)
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    // Strip file extension
    return withoutVersion.replace(/\.[^/.]+$/, '');
  } catch {
    return '';
  }
}

/**
 * Deletes an asset from Cloudinary by URL. Best-effort: never throws.
 */
export async function deleteCloudinaryAsset(
  url: string,
  resourceType: 'video' | 'image'
): Promise<void> {
  const publicId = extractPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch {
    // Swallow — DB deletion already succeeded; orphaned Cloudinary asset is acceptable
  }
}
