'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ProjectModal from '@/components/ProjectModal';
import {
  ArrowLeft,
  FolderKanban,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Plus,
  MapPin,
  Calendar,
  Layers,
  Edit,
  User
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProject = () => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(data => setProject(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading || !project) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-20 text-stone-500 text-sm">
          Loading project summary...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/projects')}
              className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  {project.name}
                </h1>
                <span className="font-mono text-xs font-bold text-[#C88A6E] bg-[#FAF7F2] border border-[#C88A6E] px-2 py-0.5 rounded-full">
                  {project.projectId}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 uppercase">
                  {project.status}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Client: <Link href={`/customers/${project.customer?.id}`} className="font-semibold text-stone-800 hover:text-[#C88A6E]">{project.customer?.name}</Link> ({project.customer?.customerId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Project</span>
            </button>
            <Link
              href="/quotations/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Quotation</span>
            </Link>
          </div>
        </div>

        {/* Project Info & Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-3 text-xs">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#C88A6E]" />
              Project Information
            </h2>
            <div className="space-y-2 text-stone-600">
              <div>
                <span className="text-stone-400 block text-[11px]">Site Location</span>
                <span className="font-semibold text-stone-900">{project.location || 'Bengaluru'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Project Type</span>
                <span className="text-stone-800">{project.projectType || 'Residential'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-400 block text-[11px]">Start Date</span>
                  <span className="text-stone-800">{formatDate(project.startDate)}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Target Handover</span>
                  <span className="text-stone-800">{formatDate(project.expectedCompletionDate)}</span>
                </div>
              </div>
              {project.notes && (
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-stone-400 block text-[11px]">Notes</span>
                  <p className="italic text-stone-600">{project.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Total Quotation Pipeline
              </span>
              <div className="text-2xl font-black text-stone-900 font-mono mt-2">
                {formatCurrency(project.totalQuotationValue)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1">
                Approved: {formatCurrency(project.approvedQuotationValue)}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Total Billed (Invoices)
              </span>
              <div className="text-2xl font-black text-blue-600 font-mono mt-2">
                {formatCurrency(project.totalInvoiceValue)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1">
                {project.invoices?.length || 0} tax invoices issued
              </span>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Total Realized Collections
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-2">
                {formatCurrency(project.totalPaid)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1">
                Received in bank & UPI
              </span>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Project Outstanding
              </span>
              <div className="text-2xl font-black text-rose-600 font-mono mt-2">
                {formatCurrency(project.totalOutstanding)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1">
                Remaining client milestone dues
              </span>
            </div>
          </div>
        </div>

        {/* Categories & Work Scopes Used In Project */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C88A6E]" />
            <span>Categories & Work Scopes Executed in this Project</span>
          </h2>
          {project.categoriesUsed?.length === 0 ? (
            <p className="text-xs text-stone-400 italic">No scope items added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {project.categoriesUsed.map((cat: string) => (
                <span
                  key={cat}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8E2D9] text-xs font-semibold text-stone-800"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Project Quotations and Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Linked Quotations */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#C88A6E]" />
                <span>Project Quotations ({project.quotations?.length || 0})</span>
              </h3>
            </div>
            <div className="divide-y divide-[#E8E2D9] text-xs">
              {project.quotations?.length === 0 ? (
                <div className="p-4 text-center text-stone-400">No quotations found for this project.</div>
              ) : (
                project.quotations.map((q: any) => (
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

          {/* Linked Invoices */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>Project Invoices ({project.invoices?.length || 0})</span>
              </h3>
            </div>
            <div className="divide-y divide-[#E8E2D9] text-xs">
              {project.invoices?.length === 0 ? (
                <div className="p-4 text-center text-stone-400">No invoices generated for this project.</div>
              ) : (
                project.invoices.map((inv: any) => (
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
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        project={project}
        customers={project.customer ? [project.customer] : []}
        onSuccess={() => fetchProject()}
      />
    </AppShell>
  );
}
