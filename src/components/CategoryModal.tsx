'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Tag } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cat: any) => void;
  category?: any;
}

export default function CategoryModal({ isOpen, onClose, onSuccess, category }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
      setIsActive(category.isActive ?? true);
      setSortOrder(category.sortOrder || 1);
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
      setSortOrder(1);
    }
    setErrorMsg('');
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const url = category ? `/api/categories/${category.id}` : '/api/categories';
      const method = category ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isActive,
          sortOrder: Number(sortOrder) || 1
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-[#E8E2D9] flex justify-between items-center bg-[#FAF7F2]">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#C88A6E]" />
            <span>{category ? 'Edit Category' : 'Add New Category'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Home Automation, Glass Partitions"
              className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="General scope of work in this category..."
              className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Display Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Status</label>
              <select
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E2D9] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : category ? 'Update' : 'Add Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
