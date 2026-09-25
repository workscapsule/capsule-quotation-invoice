'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ProjectModal from '@/components/ProjectModal';
import CustomerModal from '@/components/CustomerModal';
import {
  ArrowLeft,
  Users,
  FolderKanban,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const fetchCustomer = () => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/customers/${id}`)
      .then(res => res.json())
      .then(data => setCustomer(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  if (loading || !customer) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-20 text-stone-500 text-sm">
          Loading customer history...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/customers')}
              className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  {customer.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#C88A6E] font-mono text-xs font-bold text-[#C88A6E]">
                  {customer.customerId}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Client profile, multiple projects & cumulative financial records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCustomerModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Project</span>
            </button>
          </div>
        </div>

        {/* Customer Information & Financial Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Details Box */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C88A6E]" />
              Customer Information
            </h2>
            <div className="space-y-2 text-xs text-stone-600">
              <div>
                <span className="text-stone-400 block text-[11px]">Primary Phone</span>
                <span className="font-semibold text-stone-900">{customer.phone}</span>
              </div>
              {customer.altPhone && (
                <div>
                  <span className="text-stone-400 block text-[11px]">Alternative Phone</span>
                  <span className="text-stone-800">{customer.altPhone}</span>
                </div>
              )}
              {customer.email && (
                <div>
                  <span className="text-stone-400 block text-[11px]">Email</span>
                  <span className="text-stone-800">{customer.email}</span>
                </div>
              )}
              <div>
                <span className="text-stone-400 block text-[11px]">Billing / Site Address</span>
                <span className="text-stone-800">
                  {customer.address || '-'} {customer.city ? `• ${customer.city}` : ''} {customer.pincode}
                </span>
              </div>
              {customer.gstin && (
                <div>
                  <span className="text-stone-400 block text-[11px]">GSTIN</span>
                  <span className="font-mono font-bold text-stone-800">{customer.gstin}</span>
                </div>
              )}
              {customer.notes && (
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-stone-400 block text-[11px]">Customer Notes</span>
                  <p className="italic text-stone-600">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Total Quotation Value
              </span>
              <div className="text-2xl font-black text-stone-900 font-mono mt-2">
                {formatCurrency(customer.totalQuotationValue)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1">
                {customer.quotations?.length || 0} quotations issued
              </span>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Total Invoiced
              </span>
              <div className="text-2xl font-black text-blue-600 font-mono mt-2">
                {formatCurrency(customer.totalInvoiceValue)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1">
                {customer.invoices?.length || 0} invoices billed
              </span>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Total Collected
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-2">
                {formatCurrency(customer.totalPaid)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1">
                Received in bank / UPI / cash
              </span>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Outstanding Balance
              </span>
              <div className="text-2xl font-black text-rose-600 font-mono mt-2">
                {formatCurrency(customer.outstandingBalance)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1">
                Pending client settlement
              </span>
            </div>
          </div>
        </div>

        {/* CUSTOMER'S PROJECTS (MULTIPLE PROJECTS PER CUSTOMER) */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]">
            <div>
              <h2 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#C88A6E]" />
                <span>Customer Projects ({customer.projects?.length || 0})</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Each customer can have multiple residential or commercial interior projects.
              </p>
            </div>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Project</span>
            </button>
          </div>

          <div className="divide-y divide-[#E8E2D9] text-xs">
            {customer.projects?.length === 0 ? (
              <div className="p-6 text-center text-stone-400">
                No projects created yet for this customer.
              </div>
            ) : (
              customer.projects.map((p: any) => (
                <div key={p.id} className="p-4 sm:p-5 hover:bg-[#FAF7F2] transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-bold text-stone-900 text-sm hover:text-[#C88A6E]"
                      >
                        {p.name}
                      </Link>
                      <span className="font-mono text-[11px] font-semibold text-stone-500">
                        ({p.projectId})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                        {p.status}
                      </span>
                    </div>
                    <div className="text-stone-500 flex flex-wrap gap-4 text-[11px]">
                      {p.location && <span>Location: {p.location}</span>}
                      {p.projectType && <span>Type: {p.projectType}</span>}
                      {p.expectedCompletionDate && <span>Est. Handover: {formatDate(p.expectedCompletionDate)}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-[11px]">
                      <span className="text-stone-400 block">Quotes / Invoices</span>
                      <span className="font-bold text-stone-800">
                        {p.quotations?.length || 0} quotes • {p.invoices?.length || 0} invoices
                      </span>
                    </div>
                    <Link
                      href={`/projects/${p.id}`}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-white text-stone-700 font-semibold"
                    >
                      View Project
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RECENT QUOTATIONS & INVOICES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Quotations */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#C88A6E]" />
                <span>Customer Quotations</span>
              </h3>
              <Link
                href="/quotations/new"
                className="text-xs font-semibold text-[#C88A6E] hover:underline"
              >
                + New Quotation
              </Link>
            </div>
            <div className="divide-y divide-[#E8E2D9] text-xs">
              {customer.quotations?.length === 0 ? (
                <div className="p-4 text-center text-stone-400">No quotations recorded.</div>
              ) : (
                customer.quotations.map((q: any) => (
                  <Link
                    key={q.id}
                    href={`/quotations/${q.id}`}
                    className="p-3.5 flex justify-between items-center hover:bg-[#FAF7F2] transition-colors block"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">{q.quotationNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-stone-100 text-stone-700">
                          {q.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400">{formatDate(q.quotationDate)}</span>
                    </div>
                    <div className="font-mono font-bold text-stone-900">
                      {formatCurrency(q.roundedGrandTotal)}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Customer Invoices */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>Customer Invoices</span>
              </h3>
              <Link
                href="/invoices/new"
                className="text-xs font-semibold text-[#C88A6E] hover:underline"
              >
                + New Invoice
              </Link>
            </div>
            <div className="divide-y divide-[#E8E2D9] text-xs">
              {customer.invoices?.length === 0 ? (
                <div className="p-4 text-center text-stone-400">No invoices recorded.</div>
              ) : (
                customer.invoices.map((inv: any) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="p-3.5 flex justify-between items-center hover:bg-[#FAF7F2] transition-colors block"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">{inv.invoiceNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-stone-100 text-stone-700">
                          {inv.paymentStatus}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400">Due: {formatDate(inv.dueDate)}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-stone-900">
                        {formatCurrency(inv.roundedGrandTotal)}
                      </div>
                      <div className="text-[11px] text-rose-600 font-semibold font-mono">
                        Bal: {formatCurrency(inv.balanceDue)}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        defaultCustomerId={customer.id}
        customers={[{ id: customer.id, customerId: customer.customerId, name: customer.name }]}
        onSuccess={() => fetchCustomer()}
      />

      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        customer={customer}
        onSuccess={() => fetchCustomer()}
      />
    </AppShell>
  );
}
