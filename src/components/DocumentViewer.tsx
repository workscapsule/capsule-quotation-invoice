'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { resolveProductImage } from '@/lib/productImages';
import { generateUpiQrDataUrl } from '@/lib/upiQr';
import { DEFAULT_QUOTATION_TERMS, DEFAULT_INVOICE_TERMS } from '@/lib/terms';

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
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');

  const isQuotation = type === 'QUOTATION';
  const company = data.companySettings || {
    companyName: 'Capsule Company',
    tagline: 'YOUR SPACE MAKER',
    address: 'N.173, 1st & 2nd Flr, SLV Complex, Hebbal Kempapura, Amruthahalli, Outer Ring Road, Kariyanna Layout, Bengaluru (Urban), Karnataka – 560024',
    phone: '9187924723, 9187924523, 9187924623',
    email: 'Workscapsule@gmail.com',
    website: '',
    gstin: '29ABCDE1234F1Z5',
    bankName: 'IDFC FIRST',
    accountName: 'Mr. Poornesh Bakila Babu',
    accountNumber: '10177698837',
    ifscCode: 'IDFB0081101',
    swiftCode: 'IDFBINBBMUM',
    branch: 'BANGALORE-BASAVESHWARA NAGAR BRANCH',
    upiId: 'poornesh43-3@oksbi',
    authorizedSignatory: 'Kishmat Sah Thakuri'
  };

  useEffect(() => {
    let active = true;
    const upiId = company.upiId || 'poornesh43-3@oksbi';
    const amount = isQuotation ? undefined : (data.balanceDue ?? data.roundedGrandTotal);
    const docNumber = isQuotation ? data.quotationNumber : data.invoiceNumber;
    generateUpiQrDataUrl({
      upiId,
      name: company.accountName || 'Mr. Poornesh Bakila Babu',
      amount,
      note: `${docNumber}`
    }).then(url => {
      if (active) setUpiQrUrl(url);
    });
    return () => { active = false; };
  }, [company.upiId, company.accountName, company.companyName, data.balanceDue, data.roundedGrandTotal, isQuotation, data.quotationNumber, data.invoiceNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await generateAndDownloadPDF({ data, type, upiQrBase64: upiQrUrl });
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
          {/* Top Header: Logo & Brand on Left, Title & Company Address / Contact Details on Right */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
            {/* Circular Logo on Left with Brand Name & Tagline Below */}
            <div className="flex flex-col items-center shrink-0 self-start">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-stone-200 p-1 flex items-center justify-center shrink-0 shadow-xs bg-white">
                <img
                  src="/capsule-logo.png"
                  alt="Capsule Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-2 text-center w-28 sm:w-32">
                <p className="font-bold text-stone-900 tracking-wide text-xs leading-snug">
                  Capsule Company
                </p>
                <p className="text-[10px] text-stone-500 font-medium tracking-wide mt-0.5">
                  Your Space Maker
                </p>
              </div>
            </div>

            {/* Document Title, Company Name, Address & Contact Details on Right */}
            <div className="text-right space-y-1 max-w-sm w-full sm:w-auto">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[0.18em] text-[#1a1a1a] uppercase leading-none mb-1">
                {isQuotation ? 'QUOTATION' : 'INVOICE'}
              </h1>
              <p className="font-bold text-stone-900 tracking-wider text-xs uppercase">
                {company.companyName || 'Capsule Company'}
              </p>
              <p className="text-[11px] text-stone-500 leading-relaxed max-w-[300px] ml-auto whitespace-pre-line">
                {company.address}
              </p>
              <p className="text-[11px] text-stone-600 font-medium pt-0.5">
                Phone: {company.phone}  |  Email: {company.email}
              </p>
              {company.gstin && (
                <p className="text-[11px] text-stone-700 font-semibold">
                  GSTIN: {company.gstin}
                </p>
              )}
            </div>
          </div>

          {/* Thin Separator Line */}
          <div className="border-b border-stone-200 pt-1" />

          {/* Document Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 px-3.5 bg-stone-50/70 border border-stone-200/80 rounded-lg text-xs print:bg-white print:border-stone-300">
            <div>
              <span className="text-[10px] font-bold text-stone-500 tracking-wider uppercase block">
                {isQuotation ? 'QUOTATION NO:' : 'INVOICE NO:'}
              </span>
              <span className="font-bold font-mono text-stone-900 text-sm">
                {isQuotation ? data.quotationNumber : data.invoiceNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-500 tracking-wider uppercase block">
                {isQuotation ? 'DATE:' : 'INVOICE DATE:'}
              </span>
              <span className="font-medium text-stone-800 text-xs">
                {formatDate(isQuotation ? data.quotationDate : data.invoiceDate)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-500 tracking-wider uppercase block">
                {isQuotation ? 'VALID UNTIL:' : 'DUE DATE:'}
              </span>
              <span className="font-medium text-stone-800 text-xs">
                {formatDate(isQuotation ? data.validUntil : data.dueDate)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-500 tracking-wider uppercase block">
                {isQuotation ? 'TAX REGIME:' : 'STATUS:'}
              </span>
              {isQuotation ? (
                <span className="font-medium text-stone-800 text-xs">
                  {data.taxMode === 'IGST' ? 'Inter-state IGST' : 'CGST & SGST (18%)'}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                    data.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                    data.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                    'bg-stone-200 text-stone-800'
                  }`}>
                    {data.status || 'ISSUED'}
                  </span>
                  {data.quotation?.quotationNumber && (
                    <span className="text-[10.5px] text-stone-500 font-mono">
                      (Ref: {data.quotation.quotationNumber})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Separate Two-Column Box: BILL TO / CUSTOMER DETAILS & PROJECT & SITE LOCATION */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 shadow-2xs print:border-stone-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
              {/* Left Column: BILL TO / CUSTOMER DETAILS */}
              <div className="space-y-1.5 text-xs pr-0 sm:pr-4">
                <span className="text-[10px] font-bold text-stone-500 tracking-wider uppercase block">
                  BILL TO / CUSTOMER DETAILS
                </span>
                <p className="font-bold text-sm text-stone-950">
                  {data.customer?.name || 'Valued Client'}
                </p>
                {(data.customerAddress || data.customer?.address) && (
                  <p className="text-stone-600 leading-relaxed text-xs">
                    {data.customerAddress || data.customer?.address}
                  </p>
                )}
                {(data.customerPhone || data.customer?.phone) && (
                  <p className="text-stone-600 text-xs">
                    Phone: {data.customerPhone || data.customer?.phone}
                  </p>
                )}
                {(data.customerEmail || data.customer?.email) && (
                  <p className="text-stone-600 text-xs">
                    Email: {data.customerEmail || data.customer?.email}
                  </p>
                )}
                {data.customerGstin && (
                  <p className="text-stone-700 font-medium text-xs">
                    GSTIN: {data.customerGstin}
                  </p>
                )}
              </div>

              {/* Right Column: PROJECT & SITE LOCATION */}
              <div className="space-y-1.5 text-xs pt-4 sm:pt-0 pl-0 sm:pl-6">
                <span className="text-[10px] font-bold text-stone-500 tracking-wider uppercase block">
                  PROJECT & SITE LOCATION
                </span>
                <p className="font-bold text-sm text-stone-950">
                  {data.project?.name || 'Interior Work'}
                </p>
                <p className="text-stone-600 text-xs">
                  Site Location: {data.projectLocation || data.project?.location || 'Bengaluru'}
                </p>
                <p className="text-stone-600 text-xs">
                  Type: {data.project?.projectType || 'Residential'}
                </p>
                <p className="text-stone-600 text-xs font-mono">
                  Project ID: {data.project?.projectId || (data.project?.id ? `PRJ-${data.project.id.slice(-4).toUpperCase()}` : 'PRJ-001')}
                </p>
              </div>
            </div>
          </div>

          {/* WORK ITEMS TABLE (MINIMALIST HORIZONTAL RULE AESTHETIC WITH PRODUCT IMAGE & UNIT) */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-t-2 border-b border-stone-800 text-[10.5px] uppercase tracking-wider font-bold text-stone-900">
                  <th className="py-2.5 px-2 w-24 text-center">PRODUCT IMAGE</th>
                  <th className="py-2.5 px-2">TYPE & WORK SPECIFICATIONS</th>
                  <th className="py-2.5 px-2 text-center w-24">UNIT</th>
                  <th className="py-2.5 px-2 text-right w-32">RATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.items?.map((item: any, idx: number) => {
                  const productImg = item.imageUrl || resolveProductImage(item.categoryName, item.type, item.description);
                  const title = `${item.categoryName || 'Item'}${item.type ? ` — ${item.type}` : ''}`;
                  return (
                  <tr key={idx} className="align-middle">
                    <td className="py-2.5 px-2 text-center align-middle w-24">
                      <div
                        onClick={() => setPreviewImage({ url: productImg, title })}
                        className="w-18 h-13 sm:w-20 sm:h-14 mx-auto rounded-md overflow-hidden border border-stone-200 bg-stone-50 shadow-2xs cursor-pointer hover:border-[#C88A6E] transition-colors"
                        title="Click to view full image"
                      >
                        <img
                          src={productImg}
                          alt={title}
                          className="w-full h-full object-cover print:object-cover"
                          loading="eager"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 align-middle">
                      <div className="font-bold text-stone-900 text-xs">
                        {item.categoryName}{item.type ? ` — ${item.type}` : ''}
                      </div>
                      {item.description && (
                        <div className="text-stone-500 text-[11px] whitespace-pre-line leading-relaxed mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center text-stone-600 font-medium text-[11px] align-middle">
                      {item.unit || 'Sq.ft'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-stone-950 align-middle">
                      ₹2,500
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-b-2 border-stone-800 w-full" />
          </div>

          {/* PAYMENT SECTION */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
              {/* Payment Info & UPI QR Code */}
              <div className="w-full max-w-md space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 space-y-0.5">
                    <span className="text-[10px] font-bold text-stone-900 tracking-[0.15em] uppercase block mb-1">
                      PAYMENT INFO:
                    </span>
                    <div className="text-[11px] text-stone-600 space-y-0.5 leading-relaxed">
                      <p>Bank: <span className="font-medium text-stone-800">{company.bankName || 'IDFC FIRST'}</span></p>
                      <p>Account Name: <span className="font-medium text-stone-800">{company.accountName || 'Mr. Poornesh Bakila Babu'}</span></p>
                      <p>Account No.: <span className="font-mono font-bold text-stone-900">{company.accountNumber || '10177698837'}</span></p>
                      <p>IFSC: <span className="font-mono font-bold text-stone-900">{company.ifscCode || 'IDFB0081101'}</span></p>
                      <p>SWIFT Code: <span className="font-mono font-bold text-stone-900">{company.swiftCode || 'IDFBINBBMUM'}</span></p>
                      <p>Branch: <span className="text-stone-800 font-medium">{company.branch || 'BANGALORE-BASAVESHWARA NAGAR BRANCH'}</span></p>
                      <p>UPI ID: <span className="font-mono text-stone-800 font-semibold">{company.upiId || 'poornesh43-3@oksbi'}</span></p>
                    </div>
                  </div>

                  {/* UPI QR Code Container */}
                  {upiQrUrl && (
                    <div className="flex flex-col items-center bg-white border border-stone-300 rounded-lg p-2 shrink-0 shadow-2xs print:border-stone-400">
                      <img
                        src={upiQrUrl}
                        alt="Scan UPI QR to Pay"
                        className="w-[72px] h-[72px] object-contain"
                      />
                      <span className="text-[8.5px] font-bold text-stone-800 tracking-wider uppercase mt-1">
                        SCAN TO PAY
                      </span>
                      <span className="text-[7.5px] text-stone-500 font-medium">
                        UPI / GPay / PhonePe
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Thin Separator Line */}
          <div className="border-b border-stone-200 pt-2" />

          {/* Footer: Terms on Left, Signature on Right */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 text-xs pt-1">
            <div className="max-w-md text-[10px] text-stone-500 leading-relaxed space-y-3">
              {isQuotation && data.notes && data.notes.trim() && (
                <div>
                  <span className="font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    PROJECT SPECIFIC NOTES:
                  </span>
                  <p className="whitespace-pre-wrap break-words text-stone-600 leading-relaxed">
                    {data.notes}
                  </p>
                </div>
              )}
              <div>
                <span className="font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  TERMS & CONDITIONS:
                </span>
                <p className="whitespace-pre-line">
                  {(() => {
                    const rawTerms = data.termsAndConditions;
                    if (isQuotation) {
                      if (!rawTerms || rawTerms.includes('commence design and procurement') || rawTerms.includes('commence procurement') || rawTerms.includes('advance on approval, 40% on material delivery')) {
                        return DEFAULT_QUOTATION_TERMS;
                      }
                      return rawTerms;
                    } else {
                      if (!rawTerms || rawTerms.includes('Quotation valid for') || rawTerms.includes('pipe installation') || rawTerms.includes('plumbing fittings') || rawTerms.includes('commence design and procurement')) {
                        return DEFAULT_INVOICE_TERMS;
                      }
                      return rawTerms;
                    }
                  })()}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="font-bold text-stone-900 text-xs tracking-wider">
                For CAPSULE COMPANY
              </p>
              <div className="h-10 flex items-end justify-end">
                <span className="text-stone-800 text-sm italic font-serif font-semibold block border-b border-stone-400 pb-0.5 w-44 text-center">
                  {(company.authorizedSignatory && !company.authorizedSignatory.toLowerCase().includes('authorized signatory') && !company.authorizedSignatory.toLowerCase().includes('authorized signature'))
                    ? company.authorizedSignatory
                    : 'Kishmat Sah Thakuri'}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                {(company.authorizedSignatory && !company.authorizedSignatory.toLowerCase().includes('authorized signatory') && !company.authorizedSignatory.toLowerCase().includes('authorized signature'))
                  ? company.authorizedSignatory
                  : 'Kishmat Sah Thakuri'}
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
      {/* Image Preview Modal (Non-print) */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs no-print cursor-pointer animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <span className="text-xs font-bold text-stone-800">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            <div className="aspect-4/3 w-full bg-stone-100 overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
