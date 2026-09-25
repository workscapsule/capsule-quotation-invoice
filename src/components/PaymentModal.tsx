'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: any) => void;
  invoice?: any;
}

export default function PaymentModal({ isOpen, onClose, onSuccess, invoice }: PaymentModalProps) {
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (invoice) {
      setAmountPaid(invoice.balanceDue > 0 ? invoice.balanceDue : 0);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('BANK_TRANSFER');
      setReferenceNumber('');
      setNotes('');
    }
    setErrorMsg('');
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountPaid <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amountPaid,
          paymentDate,
          paymentMethod,
          referenceNumber,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-[#E8E2D9] flex justify-between items-center bg-[#FAF7F2]">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Record Payment</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              {errorMsg}
            </div>
          )}

          {/* Invoice Summary Box */}
          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8E2D9] space-y-1">
            <div className="flex justify-between font-semibold text-stone-800">
              <span>Invoice: {invoice.invoiceNumber}</span>
              <span>Total: {formatCurrency(invoice.roundedGrandTotal)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Total Paid so far: {formatCurrency(invoice.totalPaid)}</span>
              <span className="font-bold text-rose-600">Balance Due: {formatCurrency(invoice.balanceDue)}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Amount to Record (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-stone-400 font-bold">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                placeholder="0.00"
                className="w-full rounded-lg border border-stone-300 p-2.5 pl-8 bg-white font-mono font-bold text-stone-900 focus:ring-2 focus:ring-[#C88A6E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-medium"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="UPI">UPI / QR</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UTR / UPI Ref / Cheque No."
              className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Advance payment, milestone tranche, etc."
              className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
            />
          </div>

          <div className="pt-4 border-t border-[#E8E2D9] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Recording...' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
