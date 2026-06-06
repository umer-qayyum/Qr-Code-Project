'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Order } from '@/lib/types';

export default function QRCodeDisplay({ order }: { order: Order }) {
  const router = useRouter();
  const [qrUrl, setQrUrl] = useState<string | null>(order.qr_code_url);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQr = async () => {
    setError(null);
    setGenerating(true);

    try {
      const res = await fetch(`/api/generate-qr/${order.id}`, { method: 'POST' });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? 'Failed to generate QR code');
        return;
      }

      setQrUrl(json.data.qr_code_url as string);
      router.refresh();
    } catch {
      setError('Network error — please try again');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!qrUrl) return;
    const res = await fetch(qrUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${order.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!qrUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code — ${order.customer_name}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            img { width: 300px; height: 300px; display: block; margin: 0 auto 20px; }
            h2 { margin: 0 0 8px; font-size: 18px; }
            p { color: #666; font-size: 14px; margin: 0; }
          </style>
        </head>
        <body>
          <img src="${qrUrl}" alt="QR Code" />
          <h2>${order.customer_name}</h2>
          ${order.customer_note ? `<p>${order.customer_note}</p>` : ''}
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!order.video_url && !qrUrl) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-2">QR Code</h2>
        <p className="text-sm text-gray-400">Upload a video first to generate the QR code.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">QR Code</h2>

      {qrUrl ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <Image
              src={qrUrl}
              alt="QR Code"
              width={280}
              height={280}
              className="rounded-xl border border-gray-100"
              unoptimized
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Download PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Print QR
            </button>
          </div>
          <button
            onClick={handleGenerateQr}
            disabled={generating}
            className="w-full border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {generating ? 'Regenerating...' : 'Regenerate QR Code'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">📱</div>
            <p className="text-sm text-gray-500">Generate a QR code for this order</p>
            <p className="text-xs text-gray-400 mt-1">
              The QR will link to the recipient&apos;s video page
            </p>
          </div>
          <button
            onClick={handleGenerateQr}
            disabled={generating}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {generating ? 'Generating...' : 'Generate QR Code'}
          </button>
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
