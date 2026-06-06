import { OrderStatus } from '@/lib/types';

const statusConfig: Record<OrderStatus, { label: string; classes: string }> = {
  pending: {
    label: 'Pending',
    classes: 'bg-gray-100 text-gray-600',
  },
  video_uploaded: {
    label: 'Video Uploaded',
    classes: 'bg-blue-100 text-blue-700',
  },
  qr_generated: {
    label: 'QR Generated',
    classes: 'bg-green-100 text-green-700',
  },
  shipped: {
    label: 'Shipped',
    classes: 'bg-purple-100 text-purple-700',
  },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status] ?? statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
