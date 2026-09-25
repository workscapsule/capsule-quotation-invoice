'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: any) => void;
  customer?: any;
}

export default function CustomerModal({ isOpen, onClose, onSuccess, customer }: CustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setAltPhone(customer.altPhone || '');
      setEmail(customer.email || '');
      setAddress(customer.address || '');
      setCity(customer.city || 'Bengaluru');
      setState(customer.state || 'Karnataka');
      setPincode(customer.pincode || '');
      setGstin(customer.gstin || '');
      setNotes(customer.notes || '');
    } else {
      setName('');
      setPhone('');
      setAltPhone('');
      setEmail('');
      setAddress('');
      setCity('Bengaluru');
      setState('Karnataka');
      setPincode('');
      setGstin('');
      setNotes('');
    }
    setErrorMsg('');
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Customer Name and Phone are required.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const url = customer ? `/api/customers/${customer.id}` : '/api/customers';
      const method = customer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          altPhone,
          email,
          address,
          city,
          state,
          pincode,
          gstin,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save customer');

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
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-[#E8E2D9] flex justify-between items-center bg-[#FAF7F2]">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#C88A6E]" />
            <span>{customer ? 'Edit Customer' : 'Add New Customer'}</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98860 12345"
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Alternative Phone
              </label>
              <input
                type="text"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                placeholder="Secondary phone"
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Address / Site Location
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Apartment, Street, Landmark"
              className="w-full rounded-lg border border-stone-300 p-2.5 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="560001"
                className="w-full rounded-lg border border-stone-300 p-2 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Customer GSTIN (if registered)
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g. 29AAAAA0000A1Z5"
              className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Design preferences, special notes..."
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
              <span>{saving ? 'Saving...' : customer ? 'Update' : 'Add Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
