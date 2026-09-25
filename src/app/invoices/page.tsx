'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import PaymentModal from '@/components/PaymentModal';
import {
  Receipt,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const fetchInvoices = () => {
    setLoading(true);
    let url = `/api/invoices?q=${encodeURIComponent(search)}`;
    if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchInvoices(), 200);
    return () => clearTimeout(delay);
  }, [search, statusFilter]);

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${number}?`)) return;

    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  const statusColors: Record<string, string> = {
    UNPAID: 'bg-rose-50 text-rose-700 border-rose-300',
    PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-300',
    PAID: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    OVERDUE: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-6 h-6 text-[#C88A6E]" />
              <span>Tax Invoice Management</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Client invoices, milestone billing, multi-tranche payments, and balance tracking
            </p>
          </div>

          <Link
            href="/invoices/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tax Invoice</span>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by invoice #, customer name, project or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-stone-800 placeholder-stone-400 bg-transparent focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-stone-500">Payment Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-stone-300 p-1.5 bg-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNPAID">UNPAID</option>
              <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
              <option value="PAID">PAID</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>
        </div>

        {/* Invoice Register Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] bg-[#FAF7F2] text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Due Date</th>
                  <th className="py-3 px-4">Customer & Project</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Invoice Total (₹)</th>
                  <th className="py-3 px-4 text-right">Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">
                      Loading invoices...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-[#C88A6E]">
                          {inv.invoiceNumber}
                        </Link>
                      </td>

                      <td className="py-3 px-4 text-stone-600">
                        <div>{formatDate(inv.invoiceDate)}</div>
                        <div className="text-[11px] text-stone-400">Due: {formatDate(inv.dueDate)}</div>
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/customers/${inv.customer?.id}`}
                          className="font-bold text-stone-900 hover:text-[#C88A6E] block"
                        >
                          {inv.customer?.name}
                        </Link>
                        <div className="text-[11px] text-stone-500">
                          {inv.project?.name}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            statusColors[inv.paymentStatus] || 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                        {formatCurrency(inv.roundedGrandTotal)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-600">
                        {formatCurrency(inv.totalPaid)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-sm">
                        {inv.balanceDue > 0 ? (
                          <span className="text-rose-600">{formatCurrency(inv.balanceDue)}</span>
                        ) : (
                          <span className="text-stone-400">₹0.00</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentModalOpen(true);
                            }}
                            title="Record Payment"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/invoices/${inv.id}`}
                            title="View / Print PDF"
                            className="p-1.5 text-stone-500 hover:text-[#C88A6E] hover:bg-stone-100 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/invoices/${inv.id}/edit`}
                            title="Edit Invoice"
                            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                            title="Delete Invoice"
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={selectedInvoice}
        onSuccess={() => fetchInvoices()}
      />
    </AppShell>
  );
}
