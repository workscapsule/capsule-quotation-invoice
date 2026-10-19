'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ReceiptVoucherDocument from '@/components/ReceiptVoucherDocument';
import { ArrowLeft, Printer, Download, Edit, AlertCircle, FileCheck } from 'lucide-react';
import Link from 'next/link';
import { generateAndDownloadReceiptPDF } from '@/lib/pdfGenerator';

export default function ViewReceiptPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/receipts/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Receipt not found');
        return res.json();
      })
      .then(data => {
        setReceipt(data);
        if (searchParams.get('print') === 'true') {
          setTimeout(() => window.print(), 500);
        }
      })
      .catch(err => setError(err.message || 'Error loading receipt'))
      .finally(() => setLoading(false));
  }, [id, searchParams]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receipt) return;
    setDownloading(true);
    try {
      await generateAndDownloadReceiptPDF({ data: receipt });
    } catch (err) {
      console.error(err);
      alert('Unable to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Action Toolbar (Hidden in Print) */}
        <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <Link
              href="/receipts"
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
              title="Back to Receipts Register"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-xs font-semibold text-stone-500 block">Payment Receipt Voucher</span>
              <span className="text-base font-bold font-mono text-[#A9684C]">
                {receipt?.receiptNumber || 'Loading...'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Edit Button */}
            <Link
              href={`/receipts/${id}/edit`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Download PDF via Client */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloading || !receipt}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="p-12 text-center text-stone-500 bg-white rounded-xl border border-stone-200">
            Loading receipt voucher...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Document Rendering */}
        {!loading && receipt && (
          <div className="flex justify-center pb-12">
            <ReceiptVoucherDocument data={receipt} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
