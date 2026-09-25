'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  PieChart,
  TrendingUp,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    let url = '/api/reports';
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[#C88A6E]" />
              <span>Business Financial Reports</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Category-wise revenue breakdown, tax liability statement, and customer receivables aging
            </p>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-stone-700 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-[#C88A6E]" />
              <span>Date Filter:</span>
            </span>
            <div className="flex items-center gap-2">
              <label className="text-stone-500">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-stone-300 p-1.5 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-stone-500">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-stone-300 p-1.5 bg-white"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-rose-600 hover:underline text-xs font-medium"
              >
                Clear Dates
              </button>
            )}
          </div>

          <div className="text-xs text-stone-400">
            Real-time Database Aggregation
          </div>
        </div>

        {/* FINANCIAL SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#E8E2D9] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Period Invoiced</span>
            <div className="text-2xl font-black text-stone-900 font-mono mt-1">
              {formatCurrency(data?.totalInvoiced)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E8E2D9] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Period Collections</span>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
              {formatCurrency(data?.totalCollected)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E8E2D9] shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Period Outstanding</span>
            <div className="text-2xl font-black text-rose-600 font-mono mt-1">
              {formatCurrency(data?.totalOutstanding)}
            </div>
          </div>
        </div>

        {/* GST TAX LIABILITY STATEMENT */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#C88A6E]" />
            <span>GST Tax Liability Statement</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#E8E2D9]">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Taxable Turnover</span>
              <span className="font-mono font-bold text-stone-900 text-sm mt-0.5 block">
                {formatCurrency(data?.taxSummary?.taxableValue)}
              </span>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#E8E2D9]">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">CGST (Central)</span>
              <span className="font-mono font-bold text-stone-900 text-sm mt-0.5 block">
                {formatCurrency(data?.taxSummary?.cgst)}
              </span>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#E8E2D9]">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">SGST (State)</span>
              <span className="font-mono font-bold text-stone-900 text-sm mt-0.5 block">
                {formatCurrency(data?.taxSummary?.sgst)}
              </span>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#E8E2D9]">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">IGST (Inter-state)</span>
              <span className="font-mono font-bold text-stone-900 text-sm mt-0.5 block">
                {formatCurrency(data?.taxSummary?.igst)}
              </span>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#E8E2D9]">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Total GST Payable</span>
              <span className="font-mono font-black text-stone-900 text-sm mt-0.5 block">
                {formatCurrency(data?.taxSummary?.totalTax)}
              </span>
            </div>
          </div>
        </div>

        {/* CATEGORY-WISE QUOTATION & INVOICE REPORT */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E8E2D9] flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#C88A6E]" />
              <span>Category-Wise Work Distribution & Revenue</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] bg-[#FAF7F2] text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Interior Category</th>
                  <th className="py-3 px-4 text-center">Quote Scope Items</th>
                  <th className="py-3 px-4 text-right">Quoted Value (₹)</th>
                  <th className="py-3 px-4 text-center">Invoiced Items</th>
                  <th className="py-3 px-4 text-right">Invoiced Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {data?.categoryBreakdown?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-stone-400">No category activity recorded.</td>
                  </tr>
                ) : (
                  data?.categoryBreakdown?.map((cat: any) => (
                    <tr key={cat.category} className="hover:bg-[#FAF7F2]">
                      <td className="py-3 px-4 font-bold text-stone-900">{cat.category}</td>
                      <td className="py-3 px-4 text-center font-mono">{cat.quotationCount}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-stone-700">
                        {formatCurrency(cat.quotationValue)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{cat.invoiceCount}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                        {formatCurrency(cat.invoiceValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CUSTOMER OUTSTANDING AGING REPORT */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E8E2D9] flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Customer Outstanding Receivables Report</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] bg-[#FAF7F2] text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Customer Name & Phone</th>
                  <th className="py-3 px-4 text-right">Total Billed (₹)</th>
                  <th className="py-3 px-4 text-right">Total Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Outstanding Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {data?.outstandingReport?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-stone-400">All customer invoices settled. Zero outstanding!</td>
                  </tr>
                ) : (
                  data?.outstandingReport?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-[#FAF7F2]">
                      <td className="py-3 px-4 font-mono font-bold text-stone-800">{c.customerId}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-stone-900">{c.name}</span>
                        <div className="text-[11px] text-stone-500">{c.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(c.totalBilled)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">{formatCurrency(c.totalPaid)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {formatCurrency(c.balance)}
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
