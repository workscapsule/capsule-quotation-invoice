'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import CustomerModal from '@/components/CustomerModal';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FolderKanban,
  FileSpreadsheet,
  Receipt,
  Eye,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatters';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const fetchCustomers = () => {
    setLoading(true);
    fetch(`/api/customers?q=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete customer');
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Error deleting customer');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-[#C88A6E]" />
              <span>Customer Management</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage client directory, multi-project relationships, and account ledgers
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedCustomer(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] shadow-xs flex items-center gap-3">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by customer name, ID, phone, email or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-stone-800 placeholder-stone-400 bg-transparent focus:outline-hidden"
          />
        </div>

        {/* Customer Directory Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] bg-[#FAF7F2] text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Name & Contact</th>
                  <th className="py-3 px-4">City / Address</th>
                  <th className="py-3 px-4 text-center">Projects</th>
                  <th className="py-3 px-4 text-right">Total Invoiced</th>
                  <th className="py-3 px-4 text-right">Received</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">
                      No customers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-800">
                        {c.customerId}
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-bold text-stone-900 hover:text-[#C88A6E] block"
                        >
                          {c.name}
                        </Link>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{c.phone}</span>
                        </div>
                        {c.email && (
                          <div className="text-[11px] text-stone-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-400" />
                            <span>{c.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-stone-600 max-w-[200px] truncate">
                        {c.address || c.city || '-'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 font-semibold text-stone-700 text-[11px]">
                          <FolderKanban className="w-3 h-3 text-[#C88A6E]" />
                          <span>{c.projectCount}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium text-stone-800">
                        {formatCurrency(c.totalInvoiceValue)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-600">
                        {formatCurrency(c.totalPaid)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {c.outstandingBalance > 0 ? (
                          <span className="text-rose-600">{formatCurrency(c.outstandingBalance)}</span>
                        ) : (
                          <span className="text-stone-400">₹0.00</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/customers/${c.id}`}
                            title="View Profile"
                            className="p-1.5 text-stone-500 hover:text-[#C88A6E] hover:bg-stone-100 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setModalOpen(true);
                            }}
                            title="Edit Customer"
                            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            title="Delete Customer"
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

      <CustomerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={() => fetchCustomers()}
      />
    </AppShell>
  );
}
