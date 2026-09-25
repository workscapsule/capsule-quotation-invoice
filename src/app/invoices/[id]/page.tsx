'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import DocumentViewer from '@/components/DocumentViewer';
import PaymentModal from '@/components/PaymentModal';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const fetchInvoice = () => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/invoices/${id}`)
      .then(res => res.json())
      .then(data => setInvoice(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  if (loading || !invoice) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-20 text-stone-500 text-sm">
          Loading tax invoice...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="no-print">
          <button
            onClick={() => router.push('/invoices')}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices</span>
          </button>
        </div>

        <DocumentViewer
          type="INVOICE"
          data={invoice}
          onOpenPaymentModal={() => setPaymentModalOpen(true)}
        />

        {/* PAYMENT HISTORY ACCORDION / TABLE */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs p-6 max-w-[850px] mx-auto no-print space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Recorded Payment History ({invoice.payments?.length || 0})</span>
            </h3>
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              + Record Another Payment
            </button>
          </div>

          {invoice.payments?.length === 0 ? (
            <p className="text-xs text-stone-400 italic">No payments have been recorded for this invoice yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
                    <th className="py-2 px-3">Payment ID</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Reference / UTR</th>
                    <th className="py-2 px-3">Remarks</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {invoice.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-800">{p.paymentId}</td>
                      <td className="py-2.5 px-3 text-stone-600">{formatDate(p.paymentDate)}</td>
                      <td className="py-2.5 px-3 font-medium text-stone-700">{p.paymentMethod}</td>
                      <td className="py-2.5 px-3 font-mono text-stone-500">{p.referenceNumber || '-'}</td>
                      <td className="py-2.5 px-3 text-stone-500 italic">{p.notes || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(p.amountPaid)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={invoice}
        onSuccess={() => fetchInvoice()}
      />
    </AppShell>
  );
}
