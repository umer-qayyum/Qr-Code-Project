'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/lib/types';

const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function VideoUploadForm({ order }: { order: Order }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(order.video_url);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setError(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('orderId', order.id);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      const result = await new Promise<{
        success: boolean;
        data?: { video_url: string };
        error?: string;
      }>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error('Invalid server response'));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('POST', '/api/upload-video');
        xhr.send(formData);
      });

      if (!result.success) {
        setError(result.error ?? 'Upload failed');
        return;
      }

      setUploadedUrl(result.data?.video_url ?? null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Gift Video</h2>

      {uploadedUrl ? (
        <div className="space-y-4">
          {/* Video player */}
          <video
            src={uploadedUrl}
            controls
            playsInline
            className="w-full rounded-xl bg-black"
            style={{ maxHeight: '320px' }}
          />
          <p className="text-xs text-gray-400">Video uploaded successfully.</p>

          {/* Replace section */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm text-gray-600 font-medium">Replace video</p>
            <label className="block w-full cursor-pointer">
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-600 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-center">
                Choose video file
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            {selectedFile && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 active:bg-indigo-800 transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Replace'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Drop zone */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-sm text-gray-500 mb-1">Select a video to upload</p>
            <p className="text-xs text-gray-400">MP4, MOV, WebM — up to {MAX_SIZE_MB} MB</p>
          </div>

          {/* Custom file button */}
          <label className="block w-full cursor-pointer">
            <div className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-600 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-center">
              Choose video file
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {/* Selected file info + upload button */}
          {selectedFile && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1 bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 active:bg-indigo-800 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Uploading to Cloudinary…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
