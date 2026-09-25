'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import ProjectModal from '@/components/ProjectModal';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  Eye,
  Trash2,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const fetchProjects = () => {
    setLoading(true);
    let url = `/api/projects?q=${encodeURIComponent(search)}`;
    if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(d => setCustomers(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => fetchProjects(), 200);
    return () => clearTimeout(delay);
  }, [search, statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}"?`)) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Error deleting project');
    }
  };

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ON_HOLD: 'bg-stone-100 text-stone-700 border-stone-300',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-[#C88A6E]" />
              <span>Project Management</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Interior site executions, client projects, and project financials
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedProject(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by project name, project ID, location or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-stone-800 placeholder-stone-400 bg-transparent focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-stone-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-stone-300 p-1.5 bg-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {/* Projects Grid / Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] bg-[#FAF7F2] text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Project ID</th>
                  <th className="py-3 px-4">Project Name & Client</th>
                  <th className="py-3 px-4">Site Location</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Quotation Value</th>
                  <th className="py-3 px-4 text-right">Invoiced</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">
                      Loading projects...
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">
                      No projects found matching criteria.
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-800">
                        {p.projectId}
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-bold text-stone-900 hover:text-[#C88A6E] block"
                        >
                          {p.name}
                        </Link>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          Client: <span className="font-semibold text-stone-700">{p.customer?.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-stone-600">
                        {p.location || '-'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            statusColors[p.status] || 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium text-stone-800">
                        {formatCurrency(p.totalQuotationValue)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium text-blue-600">
                        {formatCurrency(p.totalInvoiceValue)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {p.totalOutstanding > 0 ? (
                          <span className="text-rose-600">{formatCurrency(p.totalOutstanding)}</span>
                        ) : (
                          <span className="text-stone-400">₹0.00</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/projects/${p.id}`}
                            title="View Project"
                            className="p-1.5 text-stone-500 hover:text-[#C88A6E] hover:bg-stone-100 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedProject(p);
                              setModalOpen(true);
                            }}
                            title="Edit Project"
                            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
                          >
                            <Plus className="w-4 h-4 rotate-45" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Delete Project"
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        project={selectedProject}
        customers={customers}
        onSuccess={() => fetchProjects()}
      />
    </AppShell>
  );
}
