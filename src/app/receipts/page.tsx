'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import {
  FileCheck,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Printer,
  Download,
  CreditCard,
  Building,
  CheckCircle2,
  Calendar,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDateDDMMYYYY } from '@/lib/formatters';
import { generateAndDownloadReceiptPDF } from '@/lib/pdfGenerator';

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchReceipts = () => {
    setLoading(true);
    let url = `/api/receipts?q=${encodeURIComponent(search)}`;
    if (modeFilter !== 'ALL') url += `&mode=${modeFilter}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setReceipts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchReceipts(), 200);
    return () => clearTimeout(delay);
  }, [search, modeFilter]);

  const handleDelete = async (id: string, receiptNumber: string) => {
    if (!confirm(`Are you sure you want to delete payment receipt ${receiptNumber}?`)) return;

    try {
      const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      fetchReceipts();
    } catch (err: any) {
      alert(err.message || 'Error deleting receipt');
    }
  };

  const handleDownloadPDF = async (receipt: any) => {
    setDownloadingId(receipt.id);
    try {
      await generateAndDownloadReceiptPDF({ data: receipt });
    } catch (err) {
      console.error(err);
      alert('Unable to generate PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const totalCollected = receipts.reduce((sum, r) => sum + (r.amountReceived || 0), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-[#C88A6E]" />
              <span>Payment Receipt Vouchers</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Issue, manage, and print official client payment receipts with automatic balance tracking
            </p>
          </div>

          <Link
            href="/receipts/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Receipt Voucher</span>
          </Link>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 block">
              Total Receipts Issued
            </span>
            <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">
              {receipts.length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 block">
              Total Collections Recorded
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
              {formatCurrency(totalCollected)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 block">
              Active Company
            </span>
            <span className="text-base font-bold text-stone-900 mt-1 block">
              CAPSULE COMPANY
            </span>
            <span className="text-[10px] text-[#C88A6E] font-semibold tracking-wider uppercase">
              YOUR SPACE MAKER
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search receipt #, client, project, QTN #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-[#C88A6E]"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-xs font-semibold text-stone-500">Mode:</span>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="text-xs rounded-lg border border-stone-300 p-2 bg-white font-medium"
              >
                <option value="ALL">All Payment Modes</option>
                <option value="UPI">UPI / QR</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <span className="text-xs text-stone-500">{receipts.length} vouchers</span>
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-stone-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Receipt No & Date</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Project & Location</th>
                  <th className="py-3 px-4">Payment Mode & Purpose</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500">
                      Loading payment receipt vouchers...
                    </td>
                  </tr>
                ) : receipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-500">
                      <FileCheck className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <p className="font-semibold text-stone-700">No payment receipts found.</p>
                      <p className="text-[11px] text-stone-400 mt-1">
                        Create your first receipt voucher using the button above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Receipt No & Date */}
                      <td className="py-3.5 px-4 align-top">
                        <Link
                          href={`/receipts/${r.id}`}
                          className="font-mono font-bold text-[#A9684C] hover:underline block text-xs"
                        >
                          {r.receiptNumber}
                        </Link>
                        <span className="text-[11px] text-stone-500 block mt-0.5">
                          {formatDateDDMMYYYY(r.receiptDate)}
                        </span>
                        {r.quotationNumber && (
                          <span className="text-[10px] text-stone-400 font-mono block">
                            Ref: {r.quotationNumber}
                          </span>
                        )}
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-bold text-stone-900 block text-xs">
                          {r.customerName}
                        </span>
                        <span className="text-stone-500 text-[11px] block mt-0.5">
                          {r.customerPhone}
                        </span>
                      </td>

                      {/* Project & Location */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-medium text-stone-900 block text-xs">
                          {r.projectName}
                        </span>
                        {r.projectLocation && (
                          <span className="text-stone-500 text-[11px] block mt-0.5">
                            {r.projectLocation}
                          </span>
                        )}
                      </td>

                      {/* Payment Mode & Purpose */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold bg-stone-100 text-stone-800 uppercase tracking-wider">
                          {r.paymentMode}
                        </span>
                        <span className="text-stone-500 text-[11px] block mt-1">
                          {r.paymentPurpose || 'Payment'}
                        </span>
                        {r.transactionId && (
                          <span className="text-stone-400 font-mono text-[10px] block truncate max-w-[140px]" title={r.transactionId}>
                            Txn: {r.transactionId}
                          </span>
                        )}
                      </td>

                      {/* Amount Received */}
                      <td className="py-3.5 px-4 text-right align-top font-mono">
                        <span className="font-bold text-stone-950 text-xs block">
                          {formatCurrency(r.amountReceived)}
                        </span>
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-3.5 px-4 text-right align-top font-mono">
                        <span className={`font-semibold text-xs block ${
                          r.remainingBalance < 0 ? 'text-rose-600' : 'text-[#A9684C]'
                        }`}>
                          {formatCurrency(r.remainingBalance)}
                        </span>
                        <span className="text-stone-400 text-[10px] block">
                          of {formatCurrency(r.totalProjectAmount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center align-top">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View */}
                          <Link
                            href={`/receipts/${r.id}`}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                            title="View Receipt Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Print */}
                          <button
                            type="button"
                            onClick={() => router.push(`/receipts/${r.id}?print=true`)}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                            title="Print Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Download PDF */}
                          <a
                            href={`/api/receipts/${r.id}/pdf`}
                            download={`${r.receiptNumber}.pdf`}
                            className="p-1.5 rounded-lg border border-stone-200 text-[#C88A6E] hover:text-[#B37356] hover:bg-stone-100"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* Edit */}
                          <Link
                            href={`/receipts/${r.id}/edit`}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                            title="Edit Receipt"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id, r.receiptNumber)}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Receipt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
