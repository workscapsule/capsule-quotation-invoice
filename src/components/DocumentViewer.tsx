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

      {/* DOCUMENT PREVIEW CONTAINER (MATCHES EXACT BRANDED PDF & PRINT LAYOUT) */}
      <div className="flex justify-center">
        <div
          ref={printRef}
          className="printable-document w-full max-w-[850px] bg-white border border-[#E2D9CF] shadow-lg rounded-xl p-8 sm:p-12 text-stone-800 space-y-8"
        >
          {/* Header Brand Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-[#E8E2D9] pb-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-white p-1 rounded-lg border border-stone-100 flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src="/capsule-logo.png"
                  alt="Capsule Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-[#171514] uppercase">
                  {company.companyName}
                </h1>
                <p className="text-xs font-semibold tracking-widest text-[#C88A6E] uppercase mb-1">
                  {company.tagline}
                </p>
                <p className="text-[11px] text-stone-500 max-w-sm leading-relaxed">
                  {company.address}
                </p>
                <div className="text-[11px] text-stone-600 mt-1 space-y-0.5">
                  <p><span className="font-medium text-stone-700">Phone:</span> {company.phone}</p>
                  <p><span className="font-medium text-stone-700">Email:</span> {company.email}{company.website ? ` | Web: ${company.website}` : ''}</p>
                  {company.gstin && <p className="font-semibold text-stone-800">GSTIN: {company.gstin}</p>}
                </div>
              </div>
            </div>

            {/* Document Title & Meta Box */}
            <div className="sm:text-right">
              <div className="inline-block bg-[#FAF7F2] border border-[#C88A6E]/40 px-4 py-2 rounded-lg mb-2">
                <span className="text-lg font-black tracking-widest text-[#B37356] uppercase block">
                  {isQuotation ? 'QUOTATION' : 'TAX INVOICE'}
                </span>
                <span className="text-xs font-mono font-bold text-stone-900 block">
                  {isQuotation ? data.quotationNumber : data.invoiceNumber}
                </span>
              </div>
              <div className="text-xs space-y-1 text-stone-600 font-medium">
                <div>
                  <span className="text-stone-400">Date: </span>
                  <span className="font-semibold text-stone-800">
                    {formatDate(isQuotation ? data.quotationDate : data.invoiceDate)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400">{isQuotation ? 'Valid Until: ' : 'Due Date: '}</span>
                  <span className="font-semibold text-stone-800">
                    {formatDate(isQuotation ? data.validUntil : data.dueDate)}
                  </span>
                </div>
                {!isQuotation && data.quotationId && (
                  <div className="text-[11px] text-stone-400">
                    Ref Quote: {data.quotation?.quotationNumber || 'Linked'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Client & Project Information Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF7F2] p-5 rounded-xl border border-[#E8E2D9] text-xs">
            {/* Bill To */}
            <div>
              <span className="text-[10px] font-bold text-[#C88A6E] uppercase tracking-wider block mb-1">
                Bill To / Customer Details
              </span>
              <p className="font-bold text-sm text-stone-900">{data.customer?.name}</p>
              <p className="text-stone-600 mt-0.5">{data.customerAddress || data.customer?.address || 'Site Address'}</p>
              <p className="text-stone-600 mt-1">Phone: {data.customerPhone || data.customer?.phone}</p>
              {data.customerEmail && <p className="text-stone-600">Email: {data.customerEmail}</p>}
              {data.customerGstin && (
                <p className="text-stone-700 font-semibold mt-1">Customer GSTIN: {data.customerGstin}</p>
              )}
            </div>

            {/* Project Details */}
            <div className="sm:border-l sm:border-[#E8E2D9] sm:pl-5">
              <span className="text-[10px] font-bold text-[#C88A6E] uppercase tracking-wider block mb-1">
                Project & Site Location
              </span>
              <p className="font-bold text-sm text-stone-900">{data.project?.name}</p>
              <p className="text-stone-600 mt-0.5">
                Site Location: {data.projectLocation || data.project?.location || 'Bengaluru'}
              </p>
              {data.project?.projectType && (
                <p className="text-stone-600 mt-1">Type: {data.project.projectType}</p>
              )}
              <p className="text-[11px] text-stone-500 mt-1 font-mono">
                Project ID: {data.project?.projectId}
              </p>
            </div>
          </div>

          {/* WORK ITEMS TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-stone-800 text-[11px] uppercase tracking-wider font-bold text-stone-800">
                  <th className="py-2.5 px-2 w-8 text-center">#</th>
                  <th className="py-2.5 px-2 w-36">Category</th>
                  <th className="py-2.5 px-2">Type & Work Specification</th>
                  <th className="py-2.5 px-2 w-16 text-right">Qty</th>
                  <th className="py-2.5 px-2 w-16 text-center">Unit</th>
                  <th className="py-2.5 px-2 w-24 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-2 w-28 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {data.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="align-top">
                    <td className="py-3 px-2 text-center text-stone-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-2 font-semibold text-stone-900">
                      {item.categoryName}
                    </td>
                    <td className="py-3 px-2">
                      {item.type && (
                        <div className="font-semibold text-stone-900 mb-0.5">
                          {item.type}
                        </div>
                      )}
                      {item.description && (
                        <div className="text-stone-600 text-[11px] whitespace-pre-line leading-relaxed">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-stone-600">
                      {item.unit}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-medium">
                      {formatCurrency(item.rate).replace('₹', '')}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-stone-900">
                      {formatCurrency(item.amount).replace('₹', '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Section */}
          <div className="pt-2 border-t border-stone-200">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
              {/* Left Column: Bank Details & Amount in Words */}
              <div className="sm:col-span-7 space-y-4">
                {/* Amount in words */}
                <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#E8E2D9]">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Amount in Words
                  </span>
                  <span className="text-xs font-semibold text-stone-800 italic block mt-0.5">
                    {numberToWordsINR(data.roundedGrandTotal)}
                  </span>
                </div>

                {/* Bank Account Details */}
                <div className="border border-stone-200 rounded-lg p-3.5 text-xs space-y-1 bg-white">
                  <span className="text-[11px] font-bold text-[#C88A6E] uppercase tracking-wider block mb-1">
                    Bank Account Details for Remittance
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div>
                      <span className="text-stone-400">Bank Name: </span>
                      <span className="font-semibold text-stone-800">{company.bankName}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Account Name: </span>
                      <span className="font-semibold text-stone-800">{company.accountName}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Account No: </span>
                      <span className="font-mono font-bold text-stone-900">{company.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">IFSC Code: </span>
                      <span className="font-mono font-bold text-stone-900">{company.ifscCode}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-stone-400">UPI ID: </span>
                      <span className="font-mono font-semibold text-stone-800">{company.upiId}</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                {data.termsAndConditions && (
                  <div className="text-[10px] text-stone-500 leading-relaxed border-t border-stone-100 pt-2">
                    <span className="font-bold text-stone-700 block mb-1 uppercase tracking-wider">
                      Terms & Conditions:
                    </span>
                    <p className="whitespace-pre-line font-mono">{data.termsAndConditions}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Calculation Summary */}
              <div className="sm:col-span-5 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D9] space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-600 font-medium">Subtotal</span>
                  <span className="font-mono font-semibold text-stone-900">
                    {formatCurrency(data.subtotal)}
                  </span>
                </div>

                {data.discountAmount > 0 && (
                  <div className="flex justify-between py-1 border-b border-stone-200 text-rose-600">
                    <span className="font-medium">
                      Discount {data.discountType === 'PERCENTAGE' ? `(${data.discountValue}%)` : ''}
                    </span>
                    <span className="font-mono font-semibold">
                      - {formatCurrency(data.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-700 font-semibold">Taxable Value</span>
                  <span className="font-mono font-bold text-stone-900">
                    {formatCurrency(data.taxableAmount)}
                  </span>
                </div>

                {/* Tax Breakdown */}
                {data.taxMode === 'CGST_SGST' && (
                  <>
                    <div className="flex justify-between text-[11px] text-stone-500 font-mono">
                      <span>CGST ({data.gstRate / 2}%)</span>
                      <span>{formatCurrency(data.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500 font-mono">
                      <span>SGST ({data.gstRate / 2}%)</span>
                      <span>{formatCurrency(data.sgstAmount)}</span>
                    </div>
                  </>
                )}
                {data.taxMode === 'IGST' && (
                  <div className="flex justify-between text-[11px] text-stone-500 font-mono">
                    <span>IGST ({data.gstRate}%)</span>
                    <span>{formatCurrency(data.igstAmount)}</span>
                  </div>
                )}

                {/* Additional Charges */}
                {data.additionalCharges?.map((ch: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px] text-stone-600 border-t border-stone-100 pt-1">
                    <span>{ch.description}</span>
                    <span className="font-mono font-medium">{formatCurrency(ch.amount)}</span>
                  </div>
                ))}

                {/* Grand Total */}
                <div className="pt-2 border-t-2 border-stone-800">
                  <div className="flex justify-between items-baseline">
                    <span className="font-black text-stone-900 uppercase tracking-wider text-xs">
                      Grand Total
                    </span>
                    <span className="text-base font-black text-stone-900 font-mono">
                      {formatCurrency(data.roundedGrandTotal)}
                    </span>
                  </div>
                </div>

                {/* Invoice Payment Tracking */}
                {!isQuotation && (
                  <div className="pt-2 border-t border-stone-300 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-600 font-medium">Total Paid</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {formatCurrency(data.totalPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-stone-200">
                      <span className="text-stone-900 font-bold uppercase text-[11px]">Balance Due</span>
                      <span className="font-mono font-black text-rose-600 text-sm">
                        {formatCurrency(data.balanceDue)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Signature & Watermark Footer */}
          <div className="pt-8 border-t border-[#E8E2D9] flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
            <div className="text-[10px] text-stone-400 space-y-0.5">
              <p>This is a computer-generated commercial document issued by Capsule Company.</p>
              <p>Document Generated on {formatDate(new Date())}</p>
            </div>

            <div className="text-center sm:text-right">
              <div className="h-16 flex items-end justify-center sm:justify-end">
                <span className="text-stone-300 text-xs italic tracking-widest font-serif block border-b border-stone-300 pb-1 w-48 text-center">
                  Digital Authorized Seal
                </span>
              </div>
              <p className="font-bold text-stone-800 text-xs mt-1">
                {company.authorizedSignatory}
              </p>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                Capsule Company
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
