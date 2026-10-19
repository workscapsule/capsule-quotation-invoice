'use client';

import React from 'react';
import { formatCurrency, formatDateDDMMYYYY } from '@/lib/formatters';
import { numberToWordsINR } from '@/lib/numberToWords';
import { CheckCircle2, ShieldCheck, MapPin, Phone, Mail, Building, FileCheck } from 'lucide-react';

interface ReceiptVoucherDocumentProps {
  data: any;
  companySettings?: any;
}

export default function ReceiptVoucherDocument({ data, companySettings }: ReceiptVoucherDocumentProps) {
  const company = companySettings || data?.companySettings || {
    companyName: 'CAPSULE COMPANY',
    tagline: 'YOUR SPACE MAKER',
    address: 'N.17/3, 1st & 2nd Floor, SLV Complex, Hebbal Kempapura, Amanikere, Outer Ring Road, Bengaluru, Karnataka – 560024',
    phone: '9187924723',
    email: 'workscapsule@gmail.com',
  };

  const amountReceived = Number(data?.amountReceived ?? data?.currentPaymentReceived ?? 0);
  const totalProject = Number(data?.totalProjectAmount ?? 0);
  const prevPaid = Number(data?.previousPaymentsReceived ?? 0);
  const currentPaid = amountReceived;
  const totalPaid = Number((prevPaid + currentPaid).toFixed(2));
  const remainingBalance = Number((totalProject - totalPaid).toFixed(2));

  const wordsText = data?.amountInWords || numberToWordsINR(amountReceived);
  const dateFormatted = formatDateDDMMYYYY(data?.paymentDate || data?.receiptDate || data?.createdAt);
  const receiptDateFormatted = formatDateDDMMYYYY(data?.receiptDate || data?.createdAt);

  const customerName = data?.customerName || data?.customer?.name || 'Valued Client';
  const customerPhone = data?.customerPhone || data?.customer?.phone || '-';
  const customerAddress = data?.customerAddress || data?.customer?.address || 'Bengaluru, Karnataka';
  const projectName = data?.projectName || data?.project?.name || 'Interior Work';
  const projectLocation = data?.projectLocation || data?.project?.location || 'Bengaluru';
  const paymentMode = data?.paymentMode || 'Bank Transfer';

  return (
    <div className="printable-document w-full max-w-[850px] mx-auto bg-white border border-stone-200 shadow-xl rounded-sm p-6 sm:p-10 text-stone-900 font-sans space-y-5 print:p-0 print:border-none print:shadow-none">
      {/* 1. TOP HEADER: Logo & Branding on Left, Title & Company Details on Right */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-5">
        {/* Logo and Tagline */}
        <div className="flex flex-col items-center shrink-0 self-start">
          <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full border border-stone-200 p-1 flex items-center justify-center shrink-0 shadow-2xs bg-white">
            <img
              src="/capsule-logo.png"
              alt="Capsule Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="mt-1.5 text-center w-28 sm:w-32">
            <p className="font-bold text-stone-900 tracking-wider text-xs leading-snug uppercase">
              {company.companyName || 'CAPSULE COMPANY'}
            </p>
            <p className="text-[9.5px] text-[#C88A6E] font-bold tracking-widest mt-0.5 uppercase">
              {company.tagline || 'YOUR SPACE MAKER'}
            </p>
          </div>
        </div>

        {/* Document Title & Address */}
        <div className="text-right space-y-1 max-w-md w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[0.14em] text-[#1A1817] uppercase leading-none mb-1">
            PAYMENT RECEIPT VOUCHER
          </h1>
          <p className="font-bold text-stone-900 tracking-wider text-xs uppercase">
            {company.companyName || 'CAPSULE COMPANY'}
          </p>
          <p className="text-[10.5px] text-stone-600 leading-relaxed max-w-[340px] ml-auto whitespace-pre-line">
            {company.address}
          </p>
          <p className="text-[10.5px] text-stone-700 font-medium pt-0.5">
            Contact: <span className="font-semibold text-stone-900">{company.phone}</span>  |  Email: <span className="font-semibold text-stone-900">{company.email}</span>
          </p>
        </div>
      </div>

      {/* Thin Separator Line */}
      <div className="border-b border-[#E8E2D9]" />

      {/* 2. METADATA STRIP (4 Columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2.5 px-4 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg text-xs print:bg-white print:border-stone-300">
        <div>
          <span className="text-[9.5px] font-bold text-stone-500 tracking-wider uppercase block">
            RECEIPT NUMBER
          </span>
          <span className="font-bold font-mono text-[#B37356] text-sm tracking-wide">
            {data?.receiptNumber || 'CAP-REC-0001'}
          </span>
        </div>
        <div>
          <span className="text-[9.5px] font-bold text-stone-500 tracking-wider uppercase block">
            RECEIPT DATE
          </span>
          <span className="font-semibold text-stone-900 text-xs">
            {receiptDateFormatted}
          </span>
        </div>
        <div>
          <span className="text-[9.5px] font-bold text-stone-500 tracking-wider uppercase block">
            RELATED QUOTATION
          </span>
          <span className="font-mono text-stone-800 text-xs font-semibold">
            {data?.quotationNumber || data?.quotation?.quotationNumber || 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-[9.5px] font-bold text-stone-500 tracking-wider uppercase block">
            INVOICE NUMBER
          </span>
          <span className="font-mono text-stone-800 text-xs font-semibold">
            {data?.invoiceNumber || data?.invoice?.invoiceNumber || 'N/A'}
          </span>
        </div>
      </div>

      {/* 3. TWO-COLUMN BOX: CUSTOMER DETAILS & PROJECT LOCATION */}
      <div className="rounded-xl border border-[#E8E2D9] bg-white p-4 sm:p-5 shadow-2xs print:border-stone-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
          {/* Customer Details */}
          <div className="space-y-1 text-xs pr-0 sm:pr-4">
            <span className="text-[9.5px] font-bold text-stone-500 tracking-wider uppercase block mb-1">
              CUSTOMER DETAILS
            </span>
            <p className="font-bold text-sm text-stone-950">
              {customerName}
            </p>
            <p className="text-stone-700 text-xs">
              Contact: <span className="font-medium text-stone-900">{customerPhone}</span>
            </p>
            {customerAddress && (
              <p className="text-stone-600 leading-relaxed text-xs pt-0.5">
                {customerAddress}
              </p>
            )}
          </div>

          {/* Project Details */}
          <div className="space-y-1 text-xs pt-3 sm:pt-0 pl-0 sm:pl-6">
            <span className="text-[9.5px] font-bold text-stone-500 tracking-wider uppercase block mb-1">
              PROJECT & SITE LOCATION
            </span>
            <p className="font-bold text-sm text-stone-950">
              {projectName}
            </p>
            <p className="text-stone-700 text-xs">
              Site Location: <span className="font-medium text-stone-900">{projectLocation}</span>
            </p>
            {data?.paymentPurpose && (
              <div className="pt-1">
                <span className="inline-block px-2.5 py-0.5 rounded text-[10.5px] font-semibold bg-[#FAF7F2] text-[#A9684C] border border-[#E8E2D9]">
                  Purpose: {data.paymentPurpose}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. PAYMENT DETAILS HIGHLIGHT CARD */}
      <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] p-4 sm:p-5 shadow-2xs print:border-stone-300">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Amount Received Badge on Left */}
          <div className="sm:col-span-5 border-b sm:border-b-0 sm:border-r border-[#E8E2D9] pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[9.5px] font-bold text-stone-500 tracking-wider uppercase block">
              AMOUNT RECEIVED
            </span>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#B37356] font-mono tracking-tight">
              {formatCurrency(amountReceived)}
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Payment Verified</span>
            </span>
          </div>

          {/* Key Payment Meta on Right */}
          <div className="sm:col-span-7 grid grid-cols-2 gap-3 text-xs sm:pl-2">
            <div>
              <span className="text-[9.5px] font-bold text-stone-500 uppercase tracking-wider block">
                Payment Date
              </span>
              <span className="font-semibold text-stone-900 text-xs">
                {dateFormatted}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] font-bold text-stone-500 uppercase tracking-wider block">
                Payment Mode
              </span>
              <span className="font-bold text-stone-900 text-xs uppercase tracking-wide">
                {paymentMode}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[9.5px] font-bold text-stone-500 uppercase tracking-wider block">
                Transaction ID / Reference Number
              </span>
              <span className="font-mono font-semibold text-stone-800 text-xs break-all">
                {data?.transactionId || 'N/A (Cash / Direct)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. AMOUNT IN WORDS BOX */}
      <div className="p-3.5 rounded-lg border border-[#E8E2D9] bg-white shadow-2xs print:border-stone-300">
        <span className="text-[9.5px] font-bold text-stone-500 tracking-wider uppercase block">
          AMOUNT IN WORDS:
        </span>
        <p className="text-xs text-stone-800 italic mt-0.5 font-serif leading-relaxed">
          {wordsText}
        </p>
      </div>

      {/* 6. PAYMENT SUMMARY TABLE */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">
          PAYMENT SUMMARY
        </span>
        <div className="overflow-x-auto rounded-lg border border-stone-200 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1A1817] text-white text-[10px] uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3.5">Financial Summary Component</th>
                <th className="py-2.5 px-3.5 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              <tr className="hover:bg-stone-50/50">
                <td className="py-2 px-3.5 text-stone-700 font-medium">Total Project Amount</td>
                <td className="py-2 px-3.5 text-right font-mono text-stone-900 font-semibold">
                  {formatCurrency(totalProject)}
                </td>
              </tr>
              <tr className="hover:bg-stone-50/50">
                <td className="py-2 px-3.5 text-stone-700 font-medium">Previous Payments Received</td>
                <td className="py-2 px-3.5 text-right font-mono text-stone-800 font-semibold">
                  {formatCurrency(prevPaid)}
                </td>
              </tr>
              <tr className="hover:bg-stone-50/50 bg-[#FAF7F2]/50">
                <td className="py-2 px-3.5 text-stone-900 font-semibold">Current Payment Received</td>
                <td className="py-2 px-3.5 text-right font-mono font-bold text-stone-950">
                  {formatCurrency(currentPaid)}
                </td>
              </tr>
              <tr className="bg-[#FAF7F2] font-semibold border-t-2 border-stone-300">
                <td className="py-2 px-3.5 text-stone-900 uppercase text-[11px] font-bold">Total Payments Received</td>
                <td className="py-2 px-3.5 text-right font-mono font-bold text-emerald-700 text-xs">
                  {formatCurrency(totalPaid)}
                </td>
              </tr>
              <tr className="bg-[#FDF6F0] border-t border-stone-200">
                <td className="py-2 px-3.5 text-[#A9684C] uppercase text-[11px] font-bold">Remaining Balance</td>
                <td className="py-2 px-3.5 text-right font-mono font-black text-[#A9684C] text-sm">
                  {formatCurrency(remainingBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. RECEIPT CONFIRMATION STATEMENT (Requirement 6) */}
      <div className="p-3.5 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] space-y-1">
        <span className="text-[9.5px] font-bold text-[#A9684C] uppercase tracking-wider block">
          OFFICIAL RECEIPT CONFIRMATION
        </span>
        <p className="text-xs text-stone-800 leading-relaxed font-medium">
          We acknowledge receipt of <strong className="text-stone-950">{formatCurrency(amountReceived)}</strong> ({wordsText}) from <strong className="text-stone-950">{customerName}</strong> towards <strong className="text-stone-950">{projectName}</strong> via <strong className="text-stone-950">{paymentMode}</strong> on <strong className="text-stone-950">{dateFormatted}</strong>.
        </p>
      </div>

      {/* 8. REMARKS / DESCRIPTION (if present) */}
      {data?.remarks && data.remarks.trim() && (
        <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
          <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] block mb-0.5">
            Remarks / Description:
          </span>
          <p className="whitespace-pre-line leading-relaxed">{data.remarks}</p>
        </div>
      )}

      {/* 9. SIGNATURE SECTION (Requirement 7: 4 Designated Spaces) */}
      <div className="pt-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {/* 1. Received By */}
          <div className="space-y-1">
            <div className="h-10 flex items-end justify-center border-b border-stone-400 pb-1">
              <span className="text-xs text-stone-800 font-medium">
                {data?.receivedBy || 'CAPSULE COMPANY'}
              </span>
            </div>
            <p className="text-[11px] font-bold text-stone-900 tracking-wider">
              Received By
            </p>
            <p className="text-[9.5px] text-stone-500">
              (Capsule Representative)
            </p>
          </div>

          {/* 2. Customer Signature */}
          <div className="space-y-1">
            <div className="h-10 flex items-end justify-center border-b border-stone-400 pb-1">
              <span className="text-xs text-stone-400 italic">
                Signature
              </span>
            </div>
            <p className="text-[11px] font-bold text-stone-900 tracking-wider">
              Customer Signature
            </p>
            <p className="text-[9.5px] text-stone-500">
              (Authorized Client)
            </p>
          </div>

          {/* 3. Authorized Signature */}
          <div className="space-y-1">
            <div className="h-10 flex items-end justify-center border-b border-stone-400 pb-1">
              <span className="text-xs text-stone-800 italic font-serif font-semibold">
                {(company.authorizedSignatory && !company.authorizedSignatory.toLowerCase().includes('authorized signatory'))
                  ? company.authorizedSignatory
                  : 'Kishmat Sah Thakuri'}
              </span>
            </div>
            <p className="text-[11px] font-bold text-stone-900 tracking-wider">
              {(company.authorizedSignatory && !company.authorizedSignatory.toLowerCase().includes('authorized signatory'))
                ? company.authorizedSignatory
                : 'Kishmat Sah Thakuri'}
            </p>
            <p className="text-[9.5px] text-stone-500">
              For CAPSULE COMPANY
            </p>
          </div>

          {/* 4. Company Stamp */}
          <div className="space-y-1">
            <div className="h-10 flex items-center justify-center border-b border-stone-400 pb-1 border-dashed">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
                [ STAMP ]
              </span>
            </div>
            <p className="text-[11px] font-bold text-stone-900 tracking-wider">
              Company Stamp
            </p>
            <p className="text-[9.5px] text-stone-500">
              (Official Seal)
            </p>
          </div>
        </div>
      </div>

      {/* 10. FOOTER (Requirement 8) */}
      <div className="border-t border-[#E8E2D9] pt-3 text-center space-y-1 text-xs">
        <p className="font-bold text-stone-900 text-xs tracking-wide">
          Thank you for choosing Capsule Company!
        </p>
        <p className="text-[10.5px] text-[#C88A6E] font-bold uppercase tracking-widest">
          {company.tagline || 'YOUR SPACE MAKER'}
        </p>
        <p className="text-[10px] text-stone-500">
          Contact: <span className="font-medium text-stone-700">{company.phone}</span>  |  Email: <span className="font-medium text-stone-700">{company.email}</span>
        </p>
      </div>
    </div>
  );
}
