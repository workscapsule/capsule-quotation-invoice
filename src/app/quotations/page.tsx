'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  ArrowRightCircle,
  Clock,
  Printer
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function QuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchQuotations = () => {
    setLoading(true);
    let url = `/api/quotations?q=${encodeURIComponent(search)}`;
    if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setQuotations(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchQuotations(), 200);
    return () => clearTimeout(delay);
  }, [search, statusFilter]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' })
      });
      const data = await res.json();
      if (res.ok && data.quotation) {
        router.push(`/quotations/${data.quotation.id}/edit`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to delete quotation ${number}?`)) return;

    try {
      const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      fetchQuotations();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-stone-100 text-stone-700 border-stone-300',
    SENT: 'bg-blue-50 text-blue-700 border-blue-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    CONVERTED: 'bg-purple-50 text-purple-700 border-purple-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-[#C88A6E]" />
              <span>Quotation Management</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Custom interior proposals, item scope rates, and customer approval tracking
            </p>
          </div>

          <Link
            href="/quotations/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quotation</span>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by quotation #, customer, project or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-stone-800 placeholder-stone-400 bg-transparent focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-stone-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-stone-300 p-1.5 bg-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="CONVERTED">CONVERTED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* Quotation Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] bg-[#FAF7F2] text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Date & Validity</th>
                  <th className="py-3 px-4">Customer & Project</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">
                      Loading quotations...
                    </td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">
                      No quotations found. Click &quot;+ Create New Quotation&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        <Link href={`/quotations/${q.id}`} className="hover:text-[#C88A6E]">
                          {q.quotationNumber}
                        </Link>
                      </td>

                      <td className="py-3 px-4 text-stone-600">
                        <div>{formatDate(q.quotationDate)}</div>
                        <div className="text-[11px] text-stone-400">Valid: {formatDate(q.validUntil)}</div>
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/customers/${q.customer?.id}`}
                          className="font-bold text-stone-900 hover:text-[#C88A6E] block"
                        >
                          {q.customer?.name}
                        </Link>
                        <div className="text-[11px] text-stone-500">
                          {q.project?.name} {q.projectLocation ? `• ${q.projectLocation}` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                          {q.items?.length || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            statusColors[q.status] || 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-stone-900 text-sm">
                        {formatCurrency(q.roundedGrandTotal)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/quotations/${q.id}`}
                            title="View / Print PDF"
                            className="p-1.5 text-stone-500 hover:text-[#C88A6E] hover:bg-stone-100 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/quotations/${q.id}/edit`}
                            title="Edit Quotation"
                            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(q.id)}
                            title="Duplicate Quotation"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id, q.quotationNumber)}
                            title="Delete Quotation"
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
    </AppShell>
  );
}
