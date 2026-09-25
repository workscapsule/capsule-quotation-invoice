'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Printer,
  Download,
  Edit,
  Copy,
  ArrowRightCircle,
  CreditCard,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Clock,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { numberToWordsINR } from '@/lib/numberToWords';
import { generateAndDownloadPDF } from '@/lib/pdfGenerator';

interface DocumentViewerProps {
  type: 'QUOTATION' | 'INVOICE';
  data: any;
  onStatusChange?: (newStatus: string) => void;
  onOpenPaymentModal?: () => void;
}

export default function DocumentViewer({
  type,
  data,
  onStatusChange,
  onOpenPaymentModal
}: DocumentViewerProps) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [downloading, setDownloading] = useState(false);
  const [converting, setConverting] = useState(false);

  const isQuotation = type === 'QUOTATION';
  const company = data.companySettings || {
    companyName: 'Capsule Company',
    tagline: 'YOUR SPACE MAKER',
    address: 'N.173, 1st & 2nd Flr, SLV Complex, Hebbal Kempapura, Amruthahalli, Outer Ring Road, Kariyanna Layout, Bengaluru (Urban), Karnataka – 560024',
    phone: '+91 96321 24422',
    email: 'Workscapsule@gmail.com',
    website: '',
    gstin: '29ABCDE1234F1Z5',
    bankName: 'HDFC Bank',
    accountName: 'CAPSULE COMPANY',
    accountNumber: '50200034981276',
    ifscCode: 'HDFC0001245',
    branch: 'Indiranagar Branch, Bengaluru',
    upiId: 'capsulecompany@hdfcbank',
    authorizedSignatory: 'For CAPSULE COMPANY (Authorized Signatory)'
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await generateAndDownloadPDF({ data, type });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Unable to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const [showConvertModal, setShowConvertModal] = useState(false);

  const executeConvert = async () => {
    setConverting(true);
    setShowConvertModal(false);
    try {
      const res = await fetch(`/api/quotations/${data.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Conversion failed');

      router.push(`/invoices/${resData.invoice.id}`);
    } catch (err: any) {
      alert(err.message || 'Error converting to invoice');
    } finally {
      setConverting(false);
    }
  };

  const handleConvert = () => {
    setShowConvertModal(true);
  };

  const handleDuplicate = async () => {
    if (!isQuotation) return;
    try {
      const res = await fetch(`/api/quotations/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' })
      });
      const resData = await res.json();
      if (res.ok && resData.quotation) {
        router.push(`/quotations/${resData.quotation.id}/edit`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-stone-100 text-stone-700 border-stone-300',
    SENT: 'bg-blue-50 text-blue-700 border-blue-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    CONVERTED: 'bg-purple-50 text-purple-700 border-purple-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    UNPAID: 'bg-rose-50 text-rose-700 border-rose-300',
    PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-300',
    PAID: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    OVERDUE: 'bg-red-100 text-red-800 border-red-300',
  };

  const currentStatus = isQuotation ? data.status : data.paymentStatus;

  return (
    <div className="space-y-6">
      {/* Action Toolbar (Hidden in Print) */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-stone-500">Document Status:</span>
          {isQuotation ? (
            <div className="flex items-center gap-2">
              <select
                value={data.status}
                onChange={(e) => onStatusChange?.(e.target.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider ${
                  statusColors[data.status] || 'bg-stone-100'
                }`}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="SENT">SENT</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                {data.status === 'CONVERTED' && <option value="CONVERTED">CONVERTED</option>}
              </select>
            </div>
          ) : (
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider ${
                statusColors[data.paymentStatus] || 'bg-stone-100'
              }`}
            >
              {data.paymentStatus}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Convert to Invoice Button (Quotation Only) */}
          {isQuotation && (
            <button
              onClick={handleConvert}
              disabled={converting || data.status === 'CONVERTED'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <ArrowRightCircle className="w-4 h-4" />
              <span>{data.status === 'CONVERTED' ? 'Already Converted' : 'Convert to Invoice'}</span>
            </button>
          )}

          {/* Record Payment Button (Invoice Only) */}
          {!isQuotation && onOpenPaymentModal && (
            <button
              onClick={onOpenPaymentModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>+ Record Payment</span>
            </button>
          )}

          {/* Duplicate Button (Quotation) */}
          {isQuotation && (
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
          )}

          {/* Edit Button */}
          <button
            onClick={() => router.push(isQuotation ? `/quotations/${data.id}/edit` : `/invoices/${data.id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {/* Download PDF Button */}
          <a
            href={isQuotation ? `/api/quotations/${data.id}/pdf` : `/api/invoices/${data.id}/pdf`}
            download={`${isQuotation ? (data.quotationNumber || 'QUOTATION') : (data.invoiceNumber || 'INVOICE')}.pdf`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer no-underline"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (MODERN EDITORIAL DESIGN MATCHING REFERENCE) */}
      <div className="flex justify-center">
        <div
          ref={printRef}
          className="printable-document w-full max-w-[850px] bg-white border border-stone-200 shadow-xl rounded-sm p-8 sm:p-12 text-stone-900 font-sans space-y-6"
        >
          {/* Top Header: Title & Company on Left, Circular Logo on Right */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[0.18em] text-[#1a1a1a] uppercase leading-none mb-2">
                {isQuotation ? 'QUOTATION' : 'INVOICE'}
              </h1>
              <div className="text-[11px] text-stone-500 leading-relaxed max-w-md space-y-0.5">
                <p className="font-bold text-stone-800 tracking-wider text-[11.5px] uppercase">
                  Capsule Company • Your Space Maker
                </p>
                <p>{company.address}</p>
                <p>Phone: {company.phone}  |  Email: {company.email}  |  GSTIN: {company.gstin}</p>
              </div>
            </div>

            {/* Circular Logo on Right */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-stone-200 p-1 flex items-center justify-center shrink-0 shadow-xs self-start">
              <img
                src="/capsule-logo.png"
                alt="Capsule Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Thin Separator Line */}
          <div className="border-b border-stone-200 pt-1" />

          {/* Parties & Metadata (Two Columns) */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 text-xs">
            {/* Left: Issued To */}
            <div className="space-y-1 max-w-sm">
              <span className="text-[10px] font-bold text-stone-900 tracking-[0.15em] uppercase block">
                ISSUED TO:
              </span>
              <p className="font-bold text-sm text-stone-950">{data.customer?.name}</p>
              <p className="text-stone-600 font-medium">
                Project: {data.project?.name} ({data.projectLocation || data.project?.location || 'Bengaluru'})
              </p>
              <p className="text-stone-500 leading-relaxed">
                {data.customerAddress || data.customer?.address || 'Site Address'}
              </p>
              <p className="text-stone-500">
                Phone: {data.customerPhone || data.customer?.phone || '-'}
                {data.customerEmail ? `  |  Email: ${data.customerEmail}` : ''}
              </p>
              {data.customerGstin && (
                <p className="text-stone-700 font-semibold">GSTIN: {data.customerGstin}</p>
              )}
            </div>

            {/* Right: Metadata */}
            <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between sm:justify-end sm:gap-6 items-baseline">
                <span className="text-[10.5px] font-bold text-stone-700 tracking-wider uppercase">
                  {isQuotation ? 'QUOTATION NO:' : 'INVOICE NO:'}
                </span>
                <span className="font-bold font-mono text-stone-950 text-sm">
                  {isQuotation ? data.quotationNumber : data.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-6 items-baseline">
                <span className="text-[10.5px] font-bold text-stone-700 tracking-wider uppercase">DATE:</span>
                <span className="text-stone-800 font-medium">
                  {formatDate(isQuotation ? data.quotationDate : data.invoiceDate)}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-6 items-baseline">
                <span className="text-[10.5px] font-bold text-stone-700 tracking-wider uppercase">
                  {isQuotation ? 'VALID UNTIL:' : 'DUE DATE:'}
                </span>
                <span className="text-stone-800 font-medium">
                  {formatDate(isQuotation ? data.validUntil : data.dueDate)}
                </span>
              </div>
              {isQuotation ? (
                <div className="flex justify-between sm:justify-end sm:gap-6 items-baseline">
                  <span className="text-[10.5px] font-bold text-stone-700 tracking-wider uppercase">TAX REGIME:</span>
                  <span className="text-stone-700 font-medium">
                    {data.taxMode === 'IGST' ? 'Inter-state IGST' : 'CGST + SGST (18%)'}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between sm:justify-end sm:gap-6 items-baseline">
                    <span className="text-[10.5px] font-bold text-stone-700 tracking-wider uppercase">STATUS:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                      data.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                      data.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                      'bg-stone-100 text-stone-800'
                    }`}>
                      {data.status || 'ISSUED'}
                    </span>
                  </div>
                  {data.quotation?.quotationNumber && (
                    <div className="flex justify-between sm:justify-end sm:gap-6 items-baseline">
                      <span className="text-[10.5px] font-bold text-stone-700 tracking-wider uppercase">REF QUOTE:</span>
                      <span className="font-mono text-stone-700 font-semibold">{data.quotation.quotationNumber}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* WORK ITEMS TABLE (MINIMALIST HORIZONTAL RULE AESTHETIC) */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-t-2 border-b border-stone-800 text-[10.5px] uppercase tracking-wider font-bold text-stone-900">
                  <th className="py-2.5 px-1">DESCRIPTION</th>
                  <th className="py-2.5 px-2 text-right w-28">RATE</th>
                  <th className="py-2.5 px-2 text-center w-24">QTY</th>
                  <th className="py-2.5 px-1 text-right w-32">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="align-middle">
                    <td className="py-3 px-1">
                      <div className="font-bold text-stone-900">
                        {item.categoryName}{item.type ? ` — ${item.type}` : ''}
                      </div>
                      {item.description && (
                        <div className="text-stone-500 text-[11px] whitespace-pre-line leading-relaxed mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-stone-700">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-stone-700">
                      {item.quantity} {item.unit || 'Nos'}
                    </td>
                    <td className="py-3 px-1 text-right font-mono font-bold text-stone-950">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-b-2 border-stone-800 w-full" />
          </div>

          {/* TOTALS & PAYMENT SECTION */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
              {/* Left Column: Payment Info & Amount in Words */}
              <div className="w-full sm:flex-1 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-stone-900 tracking-[0.15em] uppercase block mb-1">
                    PAYMENT INFO:
                  </span>
                  <div className="text-[11px] text-stone-600 space-y-0.5 leading-relaxed">
                    <p>Bank: <span className="font-medium text-stone-800">{company.bankName || 'HDFC Bank'}</span></p>
                    <p>Account Name: <span className="font-medium text-stone-800">{company.accountName || 'CAPSULE COMPANY'}</span></p>
                    <p>Account No.: <span className="font-mono font-bold text-stone-900">{company.accountNumber || '50200034981276'}</span></p>
                    <p>IFSC: <span className="font-mono font-bold text-stone-900">{company.ifscCode || 'HDFC0001245'}</span>  |  UPI: <span className="font-mono text-stone-800">{company.upiId || 'capsulecompany@hdfcbank'}</span></p>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-stone-700 tracking-wider uppercase block">
                    AMOUNT IN WORDS:
                  </span>
                  <p className="text-[11px] text-stone-600 italic mt-0.5 font-serif">
                    {numberToWordsINR(data.roundedGrandTotal)}
                  </p>
                </div>
              </div>

              {/* Right Column: Financial Calculations */}
              <div className="w-full sm:w-72 space-y-1.5 text-xs text-right">
                <div className="flex justify-between items-baseline py-0.5">
                  <span className="text-stone-600 font-bold uppercase tracking-wider text-[11px]">SUBTOTAL</span>
                  <span className="font-mono font-semibold text-stone-900">
                    {formatCurrency(data.subtotal)}
                  </span>
                </div>

                {data.discountAmount > 0 && (
                  <div className="flex justify-between items-baseline py-0.5 text-rose-600">
                    <span className="text-[11px]">
                      Discount {data.discountType === 'PERCENTAGE' ? `(${data.discountValue}%)` : ''}
                    </span>
                    <span className="font-mono font-semibold">
                      - {formatCurrency(data.discountAmount)}
                    </span>
                  </div>
                )}

                {/* Tax Breakdown */}
                {data.taxMode === 'CGST_SGST' ? (
                  <>
                    <div className="flex justify-between items-baseline py-0.5 text-stone-500 font-mono text-[11px]">
                      <span>CGST ({data.gstRate / 2}%)</span>
                      <span>{formatCurrency(data.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between items-baseline py-0.5 text-stone-500 font-mono text-[11px]">
                      <span>SGST ({data.gstRate / 2}%)</span>
                      <span>{formatCurrency(data.sgstAmount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-baseline py-0.5 text-stone-500 font-mono text-[11px]">
                    <span>IGST ({data.gstRate}%)</span>
                    <span>{formatCurrency(data.igstAmount)}</span>
                  </div>
                )}

                {/* Additional Charges */}
                {data.additionalCharges?.map((ch: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-baseline py-0.5 text-[11px] text-stone-600">
                    <span>{ch.description}</span>
                    <span className="font-mono">{formatCurrency(ch.amount)}</span>
                  </div>
                ))}

                {/* Grand Total */}
                <div className="pt-2 border-t border-stone-200">
                  <div className="flex justify-between items-baseline">
                    <span className="font-extrabold text-stone-950 uppercase tracking-widest text-xs">
                      TOTAL
                    </span>
                    <span className="text-base font-extrabold text-stone-950 font-mono">
                      {formatCurrency(data.roundedGrandTotal)}
                    </span>
                  </div>
                </div>

                {/* Invoice Payment Tracking */}
                {!isQuotation && (
                  <div className="pt-2 border-t border-stone-200 space-y-1 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-500 text-[11px]">Total Paid:</span>
                      <span className="font-mono font-semibold text-emerald-600">
                        {formatCurrency(data.totalPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-stone-100">
                      <span className="text-stone-900 font-bold uppercase text-[11px]">Balance Due:</span>
                      <span className="font-mono font-black text-[#B37356] text-sm">
                        {formatCurrency(data.balanceDue)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Thin Separator Line */}
          <div className="border-b border-stone-200 pt-2" />

          {/* Footer: Terms on Left, Signature on Right */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 text-xs pt-1">
            <div className="max-w-md text-[10px] text-stone-500 leading-relaxed">
              <span className="font-bold text-stone-700 uppercase tracking-wider block mb-1">
                TERMS & CONDITIONS:
              </span>
              <p className="whitespace-pre-line">
                {data.termsAndConditions || (isQuotation
                  ? '1. 50% advance on approval, 40% on material delivery at site, 10% on handover.\n2. Quotation valid for 30 days from date of issue.'
                  : '1. Payment due as per agreed schedule. Late payments may attract interest.\n2. Goods remain property of Capsule Company until fully settled.')}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="font-bold text-stone-900 text-xs tracking-wider">
                For CAPSULE COMPANY
              </p>
              <div className="h-10 flex items-end justify-end">
                <span className="text-stone-600 text-sm italic font-serif block border-b border-stone-400 pb-0.5 w-40 text-center">
                  Authorized Signatory
                </span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                (Authorized Signatory)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Convert to Invoice Confirmation Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2.5 rounded-full bg-emerald-50">
                <ArrowRightCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Convert to Tax Invoice</h3>
                <p className="text-[11px] text-stone-500">Quotation #{data.quotationNumber}</p>
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D9] space-y-1.5 text-stone-700">
              <p>
                This will automatically generate a brand-new official <strong>Tax Invoice</strong>:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-stone-600 text-[11px]">
                <li>Transfers all {data.items?.length || 0} line items and manual rates</li>
                <li>Preserves customer details, project site, taxes, and discounts</li>
                <li>Assigns the next sequential invoice number</li>
                <li>Marks this quotation as <strong>CONVERTED</strong></li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={converting}
                onClick={executeConvert}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <span>{converting ? 'Converting...' : 'Confirm & Generate Invoice'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
