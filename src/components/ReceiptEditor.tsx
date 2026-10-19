'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Download,
  Printer,
  ArrowLeft,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
  Eye,
  Edit3
} from 'lucide-react';
import { formatCurrency, toInputDate, formatDateDDMMYYYY } from '@/lib/formatters';
import { numberToWordsINR } from '@/lib/numberToWords';
import { generateAndDownloadReceiptPDF } from '@/lib/pdfGenerator';
import ReceiptVoucherDocument from './ReceiptVoucherDocument';

interface ReceiptEditorProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function ReceiptEditor({ initialData, isEdit = false }: ReceiptEditorProps) {
  const router = useRouter();

  // Quotations and Invoices for auto-filling
  const [quotations, setQuotations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Form State
  const [receiptNumber, setReceiptNumber] = useState(initialData?.receiptNumber || '');
  const [receiptDate, setReceiptDate] = useState(
    initialData?.receiptDate ? toInputDate(initialData.receiptDate) : toInputDate(new Date())
  );
  const [selectedQuotationId, setSelectedQuotationId] = useState(initialData?.quotationId || '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(initialData?.invoiceId || '');
  const [quotationNumber, setQuotationNumber] = useState(initialData?.quotationNumber || '');
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || '');

  // Customer Details
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(initialData?.customerAddress || '');

  // Project Details
  const [projectName, setProjectName] = useState(initialData?.projectName || '');
  const [projectLocation, setProjectLocation] = useState(initialData?.projectLocation || '');

  // Payment Details
  const [amountReceived, setAmountReceived] = useState<number | ''>(
    initialData?.amountReceived !== undefined ? initialData.amountReceived : ''
  );
  const [paymentDate, setPaymentDate] = useState(
    initialData?.paymentDate ? toInputDate(initialData.paymentDate) : toInputDate(new Date())
  );
  const [paymentMode, setPaymentMode] = useState(initialData?.paymentMode || 'UPI');
  const [transactionId, setTransactionId] = useState(initialData?.transactionId || '');
  const [paymentPurpose, setPaymentPurpose] = useState(initialData?.paymentPurpose || 'Part Payment');
  const [remarks, setRemarks] = useState(initialData?.remarks || '');

  // Financial Summary
  const [totalProjectAmount, setTotalProjectAmount] = useState<number | ''>(
    initialData?.totalProjectAmount !== undefined ? initialData.totalProjectAmount : ''
  );
  const [previousPaymentsReceived, setPreviousPaymentsReceived] = useState<number | ''>(
    initialData?.previousPaymentsReceived !== undefined ? initialData.previousPaymentsReceived : 0
  );

  const [receivedBy, setReceivedBy] = useState(initialData?.receivedBy || 'CAPSULE COMPANY');
  const [allowNegative, setAllowNegative] = useState(false);

  // UI States
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Load next receipt number if creating new
  useEffect(() => {
    if (!isEdit && !receiptNumber) {
      fetch('/api/receipts/next-number')
        .then(res => res.json())
        .then(data => {
          if (data.nextNumber) setReceiptNumber(data.nextNumber);
        })
        .catch(console.error);
    }
  }, [isEdit, receiptNumber]);

  // Load existing quotations and invoices for selection
  useEffect(() => {
    Promise.all([
      fetch('/api/quotations').then(res => res.json()),
      fetch('/api/invoices').then(res => res.json())
    ])
      .then(([qData, iData]) => {
        setQuotations(Array.isArray(qData) ? qData : []);
        setInvoices(Array.isArray(iData) ? iData : []);
      })
      .catch(console.error)
      .finally(() => setLoadingLookups(false));
  }, []);

  // Handle Quotation Auto-fill Selection
  const handleSelectQuotation = (qId: string) => {
    setSelectedQuotationId(qId);
    if (!qId) return;

    const q = quotations.find(item => item.id === qId);
    if (q) {
      setQuotationNumber(q.quotationNumber || '');
      setCustomerName(q.customer?.name || '');
      setCustomerPhone(q.customerPhone || q.customer?.phone || '');
      setCustomerAddress(q.customerAddress || q.customer?.address || '');
      setProjectName(q.project?.name || '');
      setProjectLocation(q.projectLocation || q.project?.location || '');
      setTotalProjectAmount(q.roundedGrandTotal ?? q.grandTotal ?? 0);

      // Check if there is an invoice linked
      if (q.convertedInvoiceId) {
        const inv = invoices.find(i => i.id === q.convertedInvoiceId);
        if (inv) {
          setSelectedInvoiceId(inv.id);
          setInvoiceNumber(inv.invoiceNumber);
          setPreviousPaymentsReceived(inv.totalPaid || 0);
        }
      }
    }
  };

  // Handle Invoice Auto-fill Selection
  const handleSelectInvoice = (invId: string) => {
    setSelectedInvoiceId(invId);
    if (!invId) return;

    const inv = invoices.find(item => item.id === invId);
    if (inv) {
      setInvoiceNumber(inv.invoiceNumber || '');
      setQuotationNumber(inv.quotation?.quotationNumber || '');
      if (inv.quotationId) setSelectedQuotationId(inv.quotationId);

      setCustomerName(inv.customer?.name || '');
      setCustomerPhone(inv.customerPhone || inv.customer?.phone || '');
      setCustomerAddress(inv.customerAddress || inv.customer?.address || '');
      setProjectName(inv.project?.name || '');
      setProjectLocation(inv.projectLocation || inv.project?.location || '');
      setTotalProjectAmount(inv.roundedGrandTotal ?? inv.grandTotal ?? 0);
      setPreviousPaymentsReceived(inv.totalPaid || 0);

      // Default amount to balance due if available
      if (inv.balanceDue > 0 && amountReceived === '') {
        setAmountReceived(inv.balanceDue);
      }
    }
  };

  // Derived Financial Calculations
  const numAmount = Number(amountReceived) || 0;
  const numTotalProject = Number(totalProjectAmount) || 0;
  const numPrevPaid = Number(previousPaymentsReceived) || 0;
  const currentPaymentReceived = numAmount;
  const totalPaymentsReceived = Number((numPrevPaid + currentPaymentReceived).toFixed(2));
  const remainingBalance = Number((numTotalProject - totalPaymentsReceived).toFixed(2));
  const amountInWords = numberToWordsINR(currentPaymentReceived);

  const isBalanceNegative = remainingBalance < 0 && numTotalProject > 0;

  // Construct Receipt Data Object for Live Preview
  const currentReceiptData = {
    receiptNumber: receiptNumber || 'CAP-REC-0001',
    receiptDate,
    quotationNumber: quotationNumber || undefined,
    invoiceNumber: invoiceNumber || undefined,
    customerName: customerName || 'Valued Client',
    customerPhone: customerPhone || '-',
    customerAddress: customerAddress || '',
    projectName: projectName || 'Interior Work',
    projectLocation: projectLocation || 'Bengaluru',
    amountReceived: currentPaymentReceived,
    amountInWords,
    paymentDate,
    paymentMode,
    transactionId: transactionId || undefined,
    paymentPurpose,
    remarks: remarks || undefined,
    totalProjectAmount: numTotalProject,
    previousPaymentsReceived: numPrevPaid,
    currentPaymentReceived,
    totalPaymentsReceived,
    remainingBalance,
    receivedBy: receivedBy || 'CAPSULE COMPANY',
    status: 'ISSUED'
  };

  // Form Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Field Validations
    if (!customerName.trim()) {
      setErrorMsg('Customer Name is required.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg('Customer Contact Number is required.');
      return;
    }
    if (!projectName.trim()) {
      setErrorMsg('Project Name is required.');
      return;
    }
    if (numAmount <= 0) {
      setErrorMsg('Amount Received must be greater than zero.');
      return;
    }
    if (numTotalProject <= 0) {
      setErrorMsg('Total Project Amount must be greater than zero.');
      return;
    }
    if (isBalanceNegative && !allowNegative) {
      setErrorMsg(
        `Remaining Balance cannot be negative (₹${remainingBalance}). Total payments received (₹${totalPaymentsReceived}) exceed project total (₹${numTotalProject}). Please adjust the amount or check the override box.`
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        receiptNumber: receiptNumber || undefined,
        receiptDate,
        customerId: initialData?.customerId || undefined,
        projectId: initialData?.projectId || undefined,
        quotationId: selectedQuotationId || undefined,
        invoiceId: selectedInvoiceId || undefined,
        quotationNumber: quotationNumber || undefined,
        invoiceNumber: invoiceNumber || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim() || undefined,
        projectName: projectName.trim(),
        projectLocation: projectLocation.trim() || undefined,
        amountReceived: numAmount,
        paymentDate,
        paymentMode,
        transactionId: transactionId.trim() || undefined,
        paymentPurpose,
        remarks: remarks.trim() || undefined,
        totalProjectAmount: numTotalProject,
        previousPaymentsReceived: numPrevPaid,
        receivedBy: receivedBy.trim() || 'CAPSULE COMPANY',
        allowNegative
      };

      const endpoint = isEdit ? `/api/receipts/${initialData.id}` : '/api/receipts';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save payment receipt');
      }

      setSuccessMsg(`Receipt ${resData.receiptNumber} saved successfully!`);
      setTimeout(() => {
        router.push(`/receipts/${resData.id}`);
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await generateAndDownloadReceiptPDF({ data: currentReceiptData });
    } catch (err) {
      console.error(err);
      alert('Unable to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/receipts')}
            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
            title="Back to Receipts Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#C88A6E]" />
              <span>{isEdit ? 'Edit Payment Receipt Voucher' : 'Create Payment Receipt Voucher'}</span>
            </h1>
            <p className="text-[11px] text-stone-500">
              {receiptNumber ? `Voucher #${receiptNumber}` : 'Auto-generating unique receipt number'}
            </p>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex xl:hidden bg-stone-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'form' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'preview' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Voucher Preview</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{downloading ? 'Generating...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Receipt'}</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 no-print">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 no-print">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1 font-semibold">{successMsg}</div>
        </div>
      )}

      {/* Main Layout: Form (Left) & Live Voucher Document Preview (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* FORM COLUMN */}
        <div className={`xl:col-span-5 space-y-6 ${activeTab === 'preview' ? 'hidden xl:block' : 'block'} no-print`}>
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Quick Auto-Fill from Quotation or Invoice */}
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D9] space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-stone-800 font-bold uppercase tracking-wider text-[11px]">
                <LinkIcon className="w-4 h-4 text-[#C88A6E]" />
                <span>Auto-Fill from Existing Quotation or Invoice</span>
              </div>
              <p className="text-[11px] text-stone-600">
                Select a client's quotation or invoice to instantly pull customer details, project site, and project total.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-600 mb-1">
                    Link Quotation
                  </label>
                  <select
                    value={selectedQuotationId}
                    onChange={(e) => handleSelectQuotation(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 p-2 bg-white text-xs text-stone-900 focus:ring-1 focus:ring-[#C88A6E]"
                  >
                    <option value="">-- None / Manual Entry --</option>
                    {quotations.map(q => (
                      <option key={q.id} value={q.id}>
                        {q.quotationNumber} - {q.customer?.name} ({formatCurrency(q.roundedGrandTotal)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-600 mb-1">
                    Link Tax Invoice
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => handleSelectInvoice(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 p-2 bg-white text-xs text-stone-900 focus:ring-1 focus:ring-[#C88A6E]"
                  >
                    <option value="">-- None / Manual Entry --</option>
                    {invoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.customer?.name} (Bal: {formatCurrency(inv.balanceDue)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Receipt Header Settings */}
            <div className="bg-white p-5 rounded-xl border border-[#E8E2D9] space-y-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-100 pb-2">
                1. Receipt Header & Identifiers
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Receipt Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="e.g. CAP-REC-0001"
                    className="w-full rounded-lg border border-stone-300 p-2.5 font-mono font-bold text-stone-900 bg-stone-50 focus:bg-white"
                    required
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Must be unique across all receipts.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Receipt Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 bg-white"
                    required
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Formatted on receipt as DD-MM-YYYY</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Related Quotation Number
                  </label>
                  <input
                    type="text"
                    value={quotationNumber}
                    onChange={(e) => setQuotationNumber(e.target.value)}
                    placeholder="e.g. CAP-QTN-0008"
                    className="w-full rounded-lg border border-stone-300 p-2.5 font-mono text-stone-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Invoice Number (if applicable)
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. CAP-INV-0004"
                    className="w-full rounded-lg border border-stone-300 p-2.5 font-mono text-stone-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white p-5 rounded-xl border border-[#E8E2D9] space-y-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-100 pb-2">
                2. Customer & Client Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full client or entity name"
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Contact Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 98860 12345"
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Customer Address
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Flat / Building, Area, Bengaluru"
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white p-5 rounded-xl border border-[#E8E2D9] space-y-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-100 pb-2">
                3. Project & Site Location
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Modular Kitchen / 3BHK Interiors"
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Project Site Location
                  </label>
                  <input
                    type="text"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    placeholder="e.g. Hebbal / Whitefield, Bengaluru"
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* Payment Transaction Details */}
            <div className="bg-white p-5 rounded-xl border border-[#E8E2D9] space-y-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-100 pb-2">
                4. Payment Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Amount Received (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-stone-300 p-2.5 pl-7 font-mono font-bold text-stone-900 text-sm focus:border-[#C88A6E]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 bg-white"
                    required
                  />
                </div>

                {/* Amount in Words Display */}
                <div className="sm:col-span-2 bg-[#FAF7F2] p-3 rounded-lg border border-[#E8E2D9]">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Amount in Words (Auto-Generated):
                  </span>
                  <p className="text-xs font-serif italic text-stone-800 mt-0.5">
                    {amountInWords}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 bg-white font-medium"
                    required
                  >
                    <option value="UPI">UPI / QR (GPay / PhonePe / Paytm)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Transaction ID / Reference Number
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. UTR-202610198902 or Cheque #10294"
                    className="w-full rounded-lg border border-stone-300 p-2.5 font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Payment Purpose
                  </label>
                  <select
                    value={paymentPurpose}
                    onChange={(e) => setPaymentPurpose(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 bg-white font-medium"
                  >
                    <option value="Advance Payment">Advance Payment (Booking / Procurement)</option>
                    <option value="Part Payment">Part Payment (Material Delivery)</option>
                    <option value="Final Payment">Final Payment (Handover)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Received By
                  </label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    placeholder="Capsule Representative name or CAPSULE COMPANY"
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Description / Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Additional notes, milestone details or terms..."
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary & Calculations */}
            <div className="bg-white p-5 rounded-xl border border-[#E8E2D9] space-y-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-100 pb-2">
                5. Project Financials & Balance Calculation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Total Project Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={totalProjectAmount}
                      onChange={(e) => setTotalProjectAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-stone-300 p-2.5 pl-7 font-mono font-bold text-stone-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Previous Payments Received (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={previousPaymentsReceived}
                      onChange={(e) => setPreviousPaymentsReceived(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-stone-300 p-2.5 pl-7 font-mono font-semibold text-stone-800"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Calculation Card */}
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-medium">Current Payment Received:</span>
                  <span className="font-mono font-bold text-stone-900">{formatCurrency(currentPaymentReceived)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-200">
                  <span className="text-stone-700 font-semibold uppercase text-[10.5px]">Total Payments Received:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(totalPaymentsReceived)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-200">
                  <span className="text-stone-900 font-extrabold uppercase text-[10.5px]">Remaining Balance:</span>
                  <span className={`font-mono font-black text-sm ${isBalanceNegative ? 'text-rose-600' : 'text-[#A9684C]'}`}>
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>

              {isBalanceNegative && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Calculated balance is negative (₹{remainingBalance})</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Total payments received exceed the total project amount. Please verify if the total project amount or previous payments are accurate.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={allowNegative}
                      onChange={(e) => setAllowNegative(e.target.checked)}
                      className="rounded border-stone-300 text-[#C88A6E] focus:ring-[#C88A6E]"
                    />
                    <span>Allow and acknowledge excess advance payment</span>
                  </label>
                </div>
              )}
            </div>

            {/* Bottom Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/receipts')}
                className="px-4 py-2.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Voucher...' : 'Save & Issue Voucher'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* LIVE PREVIEW COLUMN */}
        <div className={`xl:col-span-7 ${activeTab === 'form' ? 'hidden xl:block' : 'block'}`}>
          <div className="sticky top-20 space-y-3">
            <div className="flex items-center justify-between px-2 no-print">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C88A6E]" />
                <span>Live Single A4 Portrait Preview</span>
              </span>
              <span className="text-[10px] text-stone-400">
                Pristine layout matches print & downloaded PDF
              </span>
            </div>

            {/* Render On-Screen Document */}
            <ReceiptVoucherDocument data={currentReceiptData} />
          </div>
        </div>
      </div>
    </div>
  );
}
