'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, FolderPlus } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: any) => void;
  project?: any;
  defaultCustomerId?: string;
  customers: { id: string; customerId: string; name: string }[];
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSuccess,
  project,
  defaultCustomerId,
  customers
}: ProjectModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [projectType, setProjectType] = useState('Residential Apartment');
  const [startDate, setStartDate] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [status, setStatus] = useState('NEW');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (project) {
      setCustomerName(project.customer?.name || '');
      setCustomerPhone(project.customer?.phone || '');
      setName(project.name || '');
      setLocation(project.location || '');
      setProjectType(project.projectType || 'Residential Apartment');
      setStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
      setExpectedCompletionDate(project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toISOString().split('T')[0] : '');
      setStatus(project.status || 'NEW');
      setNotes(project.notes || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setName('');
      setLocation('');
      setProjectType('Residential Apartment');
      setStartDate('');
      setExpectedCompletionDate('');
      setStatus('NEW');
      setNotes('');
    }
    setErrorMsg('');
  }, [project, defaultCustomerId, customers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Customer Name is required. Please type the customer name.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Project Name is required.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const url = project ? `/api/projects/${project.id}` : '/api/projects';
      const method = project ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          name,
          location,
          projectType,
          startDate: startDate || null,
          expectedCompletionDate: expectedCompletionDate || null,
          status,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save project');

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
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-[#E8E2D9] flex justify-between items-center bg-[#FAF7F2]">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-[#C88A6E]" />
            <span>{project ? 'Edit Project' : 'Create New Project'}</span>
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
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Type customer name here (e.g. Ravi Kumar, ABC Constructions, Mr. Suresh)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-semibold text-stone-900 focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Customer Phone
            </label>
            <input
              type="text"
              placeholder="+91 98860 12345"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Prestige Palms 3BHK Renovation"
              className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Project Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Whitefield, Bengaluru"
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Project Type
              </label>
              <input
                type="text"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder="Villa, Apartment, Commercial"
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Expected Completion</label>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
            >
              <option value="NEW">NEW</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Scope details, design requirements..."
              className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
            />
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
              <span>{saving ? 'Saving...' : project ? 'Update Project' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
