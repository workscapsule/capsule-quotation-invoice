'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Settings, Save, Building2, CreditCard, FileText, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [form, setForm] = useState<any>({
    companyName: 'Capsule Company',
    tagline: 'YOUR SPACE MAKER',
    logoUrl: '/capsule-logo.png',
    address: 'N.173, 1st & 2nd Flr, SLV Complex, Hebbal Kempapura, Amruthahalli, Outer Ring Road, Kariyanna Layout, Bengaluru (Urban), Karnataka – 560024',
    phone: '+91 96321 24422',
    email: 'Workscapsule@gmail.com',
    website: '',
    gstin: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    upiId: '',
    quotationPrefix: 'CAP-QTN-',
    invoicePrefix: 'CAP-INV-',
    defaultTerms: '',
    authorizedSignatory: 'For CAPSULE COMPANY (Authorized Signatory)'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setForm(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-20 text-stone-500 text-sm">
          Loading company settings...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#C88A6E]" />
              <span>Company Branding & System Settings</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              These details automatically populate onto quotation and invoice PDFs, headers, bank remittance boxes, and signatures.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Company settings and terms updated successfully!</span>
          </div>
        )}

        {/* Company Identity & Logo */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#C88A6E]" />
            <span>Company Brand Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={form.companyName || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={form.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white text-[#C88A6E] font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">Office / Studio Address</label>
              <textarea
                rows={2}
                value={form.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Contact Phone(s)</label>
              <input
                type="text"
                value={form.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Official Email</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Website URL</label>
              <input
                type="text"
                value={form.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={form.gstin || ''}
                onChange={(e) => handleChange('gstin', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Banking and Remittance Details */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#C88A6E]" />
            <span>Bank Account Details (Appears on Quotations & Invoices)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={form.bankName || ''}
                onChange={(e) => handleChange('bankName', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={form.accountName || ''}
                onChange={(e) => handleChange('accountName', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Account Number</label>
              <input
                type="text"
                value={form.accountNumber || ''}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={form.ifscCode || ''}
                onChange={(e) => handleChange('ifscCode', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Branch</label>
              <input
                type="text"
                value={form.branch || ''}
                onChange={(e) => handleChange('branch', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">UPI ID</label>
              <input
                type="text"
                value={form.upiId || ''}
                onChange={(e) => handleChange('upiId', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Numbering Format & Default Terms */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#C88A6E]" />
            <span>Document Numbering & Terms</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Quotation Number Prefix</label>
              <input
                type="text"
                value={form.quotationPrefix || ''}
                onChange={(e) => handleChange('quotationPrefix', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={form.invoicePrefix || ''}
                onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-mono font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">
                Authorized Signatory Text
              </label>
              <input
                type="text"
                value={form.authorizedSignatory || ''}
                onChange={(e) => handleChange('authorizedSignatory', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">
                Default Terms and Conditions (Auto-fills into new quotes & invoices)
              </label>
              <textarea
                rows={5}
                value={form.defaultTerms || ''}
                onChange={(e) => handleChange('defaultTerms', e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-mono text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </AppShell>
  );
}
