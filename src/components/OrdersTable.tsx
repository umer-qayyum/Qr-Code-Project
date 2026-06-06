'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Order } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { supabaseBrowserClient } from '@/lib/supabase/client';

const createOrderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_note: z.string().optional(),
});

type CreateOrderForm = z.infer<typeof createOrderSchema>;

interface OrdersTableProps {
  initialOrders: Order[];
}

export default function OrdersTable({ initialOrders }: OrdersTableProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [showModal, setShowModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
  });

  const handleLogout = async () => {
    await supabaseBrowserClient.auth.signOut();
    router.push('/login');
  };

  const handleDeleteOrder = async (id: string) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        setDeleteError(json.error ?? 'Failed to delete order');
        return;
      }
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setConfirmDeleteId(null);
    } catch {
      setDeleteError('Network error — please try again');
    } finally {
      setDeleting(false);
    }
  };

  const onCreateOrder = async (data: CreateOrderForm) => {
    setCreateError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) {
        setCreateError(json.error ?? 'Failed to create order');
        return;
      }
      setOrders((prev) => [json.data as Order, ...prev]);
      setShowModal(false);
      reset();
    } catch {
      setCreateError('Network error — please try again');
    }
  };

  const formattedDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => {
              reset();
              setCreateError(null);
              setShowModal(true);
            }}
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          >
            + Create Order
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 sm:flex-none text-sm text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Global delete error */}
      {deleteError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{deleteError}</p>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────── */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No orders yet. Create your first one.</p>
        </div>
      ) : (
        <>
          {/* ── Mobile cards (< md) ──────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-gray-900 text-sm leading-snug flex-1 min-w-0 truncate">
                    {order.customer_name}
                  </p>
                  <StatusBadge status={order.status} />
                </div>

                {order.customer_note && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2 italic">
                    {order.customer_note}
                  </p>
                )}

                <p className="text-xs text-gray-400 mb-3">{formattedDate(order.created_at)}</p>

                {confirmDeleteId === order.id ? (
                  <div className="border-t border-red-100 pt-3 space-y-2">
                    <p className="text-xs text-red-700 font-medium">
                      Delete this order and its video?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={deleting}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {deleting ? 'Deleting…' : 'Yes, delete'}
                      </button>
                      <button
                        onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }}
                        disabled={deleting}
                        className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <button
                      onClick={() => { setConfirmDeleteId(order.id); setDeleteError(null); }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      Delete
                    </button>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-xs px-3 py-1.5 rounded-md border border-indigo-100 hover:border-indigo-300 active:bg-indigo-50 transition-colors"
                    >
                      View / Upload
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Desktop table (md+) ──────────────────────────────── */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Customer</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">
                      Note
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Created</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900 max-w-[180px] truncate">
                        {order.customer_name}
                      </td>
                      <td className="px-5 py-4 text-gray-500 hidden lg:table-cell max-w-xs truncate">
                        {order.customer_note ?? '—'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4 text-gray-400 whitespace-nowrap">
                        {formattedDate(order.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        {confirmDeleteId === order.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-600 font-medium">Sure?</span>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={deleting}
                              className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {deleting ? 'Deleting…' : 'Delete'}
                            </button>
                            <button
                              onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }}
                              disabled={deleting}
                              className="text-xs text-gray-500 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setConfirmDeleteId(order.id); setDeleteError(null); }}
                              className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                            <Link
                              href={`/dashboard/orders/${order.id}`}
                              className="text-indigo-600 hover:text-indigo-800 font-medium text-xs px-3 py-1.5 rounded-md border border-indigo-100 hover:border-indigo-300 transition-colors whitespace-nowrap"
                            >
                              View / Upload
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Create order modal ─────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white w-full sm:rounded-2xl rounded-t-2xl shadow-xl sm:max-w-md p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create New Order</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit(onCreateOrder)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('customer_name')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Jane Smith"
                />
                {errors.customer_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.customer_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Note
                </label>
                <textarea
                  {...register('customer_note')}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Happy birthday! Hope you enjoy this..."
                />
              </div>

              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-700">{createError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 active:bg-indigo-800 transition-colors"
                >
                  {isSubmitting ? 'Creating…' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
