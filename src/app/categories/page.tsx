'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import CategoryModal from '@/components/CategoryModal';
import { Tags, Plus, Edit, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const fetchCategories = () => {
    setLoading(true);
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove or deactivate category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');
      if (data.message) alert(data.message);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Tags className="w-6 h-6 text-[#C88A6E]" />
              <span>Category Management</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Configurable work scope categories for quotation & invoice line items (No hard-coded limits)
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedCategory(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>

        {/* Note on Zero Fixed Prices */}
        <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs text-stone-600 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#C88A6E] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-stone-900">Custom Rates & Flexible Units Rule: </span>
            Categories define the high-level interior discipline only. Type, description, quantity, unit, and price rate are entered completely manually per project and client requirements.
          </div>
        </div>

        {/* Category Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] bg-[#FAF7F2] text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4 w-16 text-center">#</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400">
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-[#FAF7F2] transition-colors group">
                      <td className="py-3.5 px-4 text-center font-mono text-stone-400">
                        {c.sortOrder || idx + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/categories/${c.id}`}
                          className="font-bold text-stone-900 group-hover:text-[#C88A6E] transition-colors flex items-center gap-2"
                        >
                          <span>{c.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to Enter Items &rarr;
                          </span>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        {c.description || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {c.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                            <XCircle className="w-3 h-3" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/categories/${c.id}`}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E8E2D9] text-[#C88A6E] hover:bg-[#C88A6E] hover:text-white font-semibold text-[11px] transition-all"
                            title="Enter Project Items"
                          >
                            Enter Items
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedCategory(c);
                              setModalOpen(true);
                            }}
                            title="Edit Category Name"
                            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            title="Delete or Deactivate"
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

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        category={selectedCategory}
        onSuccess={() => fetchCategories()}
      />
    </AppShell>
  );
}
