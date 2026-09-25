'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import PaymentModal from '@/components/PaymentModal';
import { CreditCard, Search, Plus, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const fetchPayments = () => {
    setLoading(true);
    let url = '/api/payments';
    if (methodFilter !== 'ALL') url += `?method=${methodFilter}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setPayments(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
    fetch('/api/invoices')
      .then(res => res.json())
      .then(data => setInvoices(Array.isArray(data) ? data.filter((i: any) => i.balanceDue > 0) : []));
  }, [methodFilter]);

  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-600" />
              <span>Payments & Collections Register</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Record advance payments, tranche disbursements, and bank/UPI remittances
            </p>
          </div>

          {invoices.length > 0 && (
            <button
              onClick={() => {
                setSelectedInvoice(invoices[0]);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Payment</span>
            </button>
          )}
        </div>

        {/* Filter and Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] md:col-span-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-stone-500">Method Filter:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="text-xs rounded-lg border border-stone-300 p-2 bg-white font-medium"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI / QR</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <span className="text-xs text-stone-500">{payments.length} transactions recorded</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D9] text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Collections</span>
            <span className="text-lg font-black text-emerald-600 font-mono block">
              {formatCurrency(totalCollected)}
            </span>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] bg-[#FAF7F2] text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer & Project</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference / UTR</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">Loading payments...</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">
                      No payments found. Payments recorded against invoices will appear here.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{p.paymentId}</td>
                      <td className="py-3 px-4 text-stone-600">{formatDate(p.paymentDate)}</td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        <Link href={`/invoices/${p.invoiceId}`} className="text-blue-600 hover:underline">
                          {p.invoice?.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-stone-800">{p.customer?.name}</span>
                        <div className="text-[11px] text-stone-400">{p.project?.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">{p.referenceNumber || '-'}</td>
                      <td className="py-3 px-4 text-stone-500 italic max-w-xs truncate">{p.notes || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                        {formatCurrency(p.amountPaid)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedInvoice && (
        <PaymentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          invoice={selectedInvoice}
          onSuccess={() => fetchPayments()}
        />
      )}
    </AppShell>
  );
}
