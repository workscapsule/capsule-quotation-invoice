'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import {
  Users,
  FolderKanban,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  IndianRupee,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-20 text-stone-500 text-sm">
          Loading business dashboard...
        </div>
      </AppShell>
    );
  }

  const m = data?.metrics || {};

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="bg-[#171514] text-white rounded-2xl p-6 sm:p-8 border border-[#2D2825] shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="space-y-1.5 relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#C88A6E]/20 text-[#C88A6E] text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C88A6E]"></span>
              Interior Business Intelligence
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Capsule Company Dashboard
            </h1>
            <p className="text-xs text-stone-400 max-w-xl">
              Live tracking for bespoke client quotations, project billing pipelines, collections, and outstanding receivables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 relative z-10">
            <Link
              href="/quotations/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Quotation</span>
            </Link>
            <Link
              href="/invoices/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
          </div>
        </div>

        {/* PRIMARY FINANCIAL KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Quotation Value */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Quotation Pipeline</span>
              <FileSpreadsheet className="w-4 h-4 text-[#C88A6E]" />
            </div>
            <div>
              <div className="text-2xl font-black text-stone-900 font-mono">
                {formatCurrency(m.totalQuotationValue)}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
                <span>{m.totalQuotations} total quotes</span>
                <span className="text-emerald-600 font-semibold">{m.approvedQuotations} approved</span>
              </div>
            </div>
          </div>

          {/* Total Invoice Value */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Invoiced</span>
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-stone-900 font-mono">
                {formatCurrency(m.totalInvoiceValue)}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
                <span>{m.totalInvoices} invoices billed</span>
                <span className="text-blue-600 font-semibold">{m.paidInvoices} settled</span>
              </div>
            </div>
          </div>

          {/* Amount Received / Collected */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Received</span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {formatCurrency(m.totalAmountReceived)}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Realized collections in bank & UPI
              </div>
            </div>
          </div>

          {/* Total Outstanding Amount */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Outstanding</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-rose-600 font-mono">
                {formatCurrency(m.totalOutstandingAmount)}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
                <span>{m.partiallyPaidInvoices} partial</span>
                <span className="text-rose-600 font-semibold">{m.overdueInvoices} overdue</span>
              </div>
            </div>
          </div>
        </div>

        {/* STATUS BREAKDOWN GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-stone-400">Total Customers</span>
            <div className="text-xl font-bold text-stone-900">{m.totalCustomers}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-stone-400">Active Projects</span>
            <div className="text-xl font-bold text-stone-900">{m.totalProjects}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-amber-600">Pending Quotes</span>
            <div className="text-xl font-bold text-amber-600">{m.pendingQuotations}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-emerald-600">Approved Quotes</span>
            <div className="text-xl font-bold text-emerald-600">{m.approvedQuotations}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-stone-400">Unpaid Invoices</span>
            <div className="text-xl font-bold text-stone-800">{m.unpaidInvoices}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-rose-600">Overdue Invoices</span>
            <div className="text-xl font-bold text-rose-600">{m.overdueInvoices}</div>
          </div>
        </div>

        {/* RECENT ACTIVITY TABLES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Quotations */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E8E2D9] flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#C88A6E]" />
                <span>Recent Quotations</span>
              </h2>
              <Link
                href="/quotations"
                className="text-xs font-semibold text-[#C88A6E] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-[#E8E2D9] text-xs">
              {data.recentQuotations?.length === 0 ? (
                <div className="p-6 text-center text-stone-400">No quotations found.</div>
              ) : (
                data.recentQuotations.map((q: any) => (
                  <Link
                    key={q.id}
                    href={`/quotations/${q.id}`}
                    className="p-4 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors block"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">{q.quotationNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-stone-100 text-stone-700">
                          {q.status}
                        </span>
                      </div>
                      <p className="text-stone-500 mt-0.5 text-[11px]">
                        {q.customer?.name} • {q.project?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-stone-900">
                        {formatCurrency(q.roundedGrandTotal)}
                      </div>
                      <div className="text-[11px] text-stone-400">{formatDate(q.quotationDate)}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E8E2D9] flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>Recent Invoices</span>
              </h2>
              <Link
                href="/invoices"
                className="text-xs font-semibold text-[#C88A6E] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-[#E8E2D9] text-xs">
              {data.recentInvoices?.length === 0 ? (
                <div className="p-6 text-center text-stone-400">No invoices created yet.</div>
              ) : (
                data.recentInvoices.map((inv: any) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="p-4 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors block"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">{inv.invoiceNumber}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            inv.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.paymentStatus === 'PARTIALLY_PAID'
                              ? 'bg-amber-100 text-amber-800'
                              : inv.paymentStatus === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </div>
                      <p className="text-stone-500 mt-0.5 text-[11px]">
                        {inv.customer?.name} • {inv.project?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-stone-900">
                        {formatCurrency(inv.roundedGrandTotal)}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        Bal: <span className="font-semibold text-rose-600">{formatCurrency(inv.balanceDue)}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RECENT PAYMENTS REGISTER */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E8E2D9] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Recent Payment Transactions</span>
            </h2>
            <Link
              href="/payments"
              className="text-xs font-semibold text-[#C88A6E] hover:underline flex items-center gap-1"
            >
              <span>View all payments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-stone-500 font-bold">
                  <th className="py-2.5 px-4">Payment ID</th>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {data.recentPayments?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-stone-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.recentPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{p.paymentId}</td>
                      <td className="py-3 px-4 font-mono text-stone-700">{p.invoice?.invoiceNumber}</td>
                      <td className="py-3 px-4 font-semibold text-stone-800">{p.customer?.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-500">{formatDate(p.paymentDate)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
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
    </AppShell>
  );
}
