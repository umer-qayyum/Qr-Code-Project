'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/lib/types';
import type { CloudinarySignature } from '@/app/api/sign-upload/route';

const MAX_SIZE_MB = 100;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type UploadPhase = 'signing' | 'uploading' | 'saving' | null;

function phaseLabel(phase: UploadPhase, progress: number): string {
  if (phase === 'signing') return 'Preparing upload…';
  if (phase === 'uploading') return `Uploading to Cloudinary… ${progress}%`;
  if (phase === 'saving') return 'Saving…';
  return '';
}

export default function VideoUploadForm({ order }: { order: Order }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>(null);
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

    try {
      // ── Step 1: Get a signed upload token from our server ──────
      setPhase('signing');
      const signRes = await fetch('/api/sign-upload', { method: 'POST' });
      const signJson = await signRes.json();

      if (!signJson.success) {
        setError(signJson.error ?? 'Failed to prepare upload');
        return;
      }

      const sig = signJson.data as CloudinarySignature;

      // ── Step 2: Upload the video directly to Cloudinary ────────
      setPhase('uploading');

      const cloudinaryForm = new FormData();
      cloudinaryForm.append('file', selectedFile);
      cloudinaryForm.append('api_key', sig.api_key);
      cloudinaryForm.append('timestamp', String(sig.timestamp));
      cloudinaryForm.append('signature', sig.signature);
      cloudinaryForm.append('folder', sig.folder);

      const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`;

      const secureUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const res = JSON.parse(xhr.responseText) as { secure_url?: string; error?: { message: string } };
            if (xhr.status >= 400 || res.error) {
              reject(new Error(res.error?.message ?? 'Cloudinary upload failed'));
            } else if (!res.secure_url) {
              reject(new Error('No URL returned from Cloudinary'));
            } else {
              resolve(res.secure_url);
            }
          } catch {
            reject(new Error('Unexpected response from Cloudinary'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.open('POST', cloudinaryEndpoint);
        xhr.send(cloudinaryForm);
      });

      // ── Step 3: Save the URL to our database ──────────────────
      setPhase('saving');

      const saveRes = await fetch('/api/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, video_url: secureUrl }),
      });
      const saveJson = await saveRes.json();

      if (!saveJson.success) {
        setError(saveJson.error ?? 'Failed to save video');
        return;
      }

      setUploadedUrl(secureUrl);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setPhase(null);
    }
  };

  const FileInput = ({ label }: { label: string }) => (
    <label className="block w-full cursor-pointer">
      <div className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-600 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-center select-none">
        {label}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="sr-only"
      />
    </label>
  );

  const SelectedFileRow = ({ actionLabel }: { actionLabel: string }) =>
    selectedFile ? (
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
          {uploading ? 'Uploading…' : actionLabel}
        </button>
      </div>
    ) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Gift Video</h2>

      {uploadedUrl ? (
        <div className="space-y-4">
          <video
            src={uploadedUrl}
            controls
            playsInline
            className="w-full rounded-xl bg-black"
            style={{ maxHeight: '320px' }}
          />
          <p className="text-xs text-gray-400">Video uploaded successfully.</p>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm text-gray-600 font-medium">Replace video</p>
            <FileInput label="Choose video file" />
            <SelectedFileRow actionLabel="Replace" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-sm text-gray-500 mb-1">Select a video to upload</p>
            <p className="text-xs text-gray-400">MP4, MOV, WebM — up to {MAX_SIZE_MB} MB</p>
          </div>

          <FileInput label="Choose video file" />
          <SelectedFileRow actionLabel="Upload Video" />
        </div>
      )}

      {/* Progress bar — visible during the uploading phase */}
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{phaseLabel(phase, progress)}</span>
            {phase === 'uploading' && <span>{progress}%</span>}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-200 ${
                phase === 'uploading' ? 'bg-indigo-600' : 'bg-indigo-300 animate-pulse w-full'
              }`}
              style={phase === 'uploading' ? { width: `${progress}%` } : undefined}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
