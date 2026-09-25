'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Copy,
  Save,
  ArrowLeft,
  Calculator,
  Percent,
  Receipt,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { calculateFinancials, LineItemInput, AdditionalChargeInput, TaxMode, DiscountType } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';

interface CustomerOption {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  address?: string;
  gstin?: string;
  projects: { id: string; projectId: string; name: string; location?: string }[];
}

interface CategoryOption {
  id: string;
  name: string;
}

interface QuotationEditorProps {
  initialData?: any;
  isEdit?: boolean;
}

const COMMON_UNITS = ['Sq.ft', 'Nos', 'R.ft', 'Sq.m', 'Kg', 'Set', 'Lump Sum', 'Hours', 'Days', 'Custom'];

export default function QuotationEditor({ initialData, isEdit = false }: QuotationEditorProps) {
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. CUSTOMER CONTACT DETAILS (MANUALLY TYPED — NO DROPDOWNS)
  const [customerName, setCustomerName] = useState(initialData?.customer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || initialData?.customer?.phone || '');
  const [customerAltPhone, setCustomerAltPhone] = useState(initialData?.customer?.altPhone || '');
  const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail || initialData?.customer?.email || '');
  const [customerAddress, setCustomerAddress] = useState(initialData?.customerAddress || initialData?.customer?.address || '');
  const [customerCity, setCustomerCity] = useState(initialData?.customer?.city || 'Bengaluru');
  const [customerState, setCustomerState] = useState(initialData?.customer?.state || 'Karnataka');
  const [customerPincode, setCustomerPincode] = useState(initialData?.customer?.pincode || '');
  const [customerGstin, setCustomerGstin] = useState(initialData?.customerGstin || initialData?.customer?.gstin || '');

  // 2. PROJECT DETAILS (MANUALLY TYPED)
  const [projectName, setProjectName] = useState(initialData?.project?.name || '');
  const [projectLocation, setProjectLocation] = useState(initialData?.projectLocation || initialData?.project?.location || '');
  const [quotationDate, setQuotationDate] = useState(
    initialData?.quotationDate ? new Date(initialData.quotationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState(
    initialData?.validUntil
      ? new Date(initialData.validUntil).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState(initialData?.status || 'DRAFT');

  // Items State (No fixed rates, free-text type & description)
  const [items, setItems] = useState<LineItemInput[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items.map((it: any) => ({
          categoryId: it.categoryId || null,
          categoryName: it.categoryName || 'General',
          type: it.type || '',
          description: it.description || '',
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'Nos',
          rate: Number(it.rate) || 0,
          amount: Number(it.amount) || 0,
          sortOrder: it.sortOrder
        }))
      : [
          {
            categoryName: 'Modular Kitchen',
            type: '',
            description: '',
            quantity: 1,
            unit: 'Sq.ft',
            rate: 0,
            amount: 0
          }
        ]
  );

  // Financial Options
  const [discountType, setDiscountType] = useState<DiscountType>(initialData?.discountType || 'NONE');
  const [discountValue, setDiscountValue] = useState<number>(Number(initialData?.discountValue) || 0);
  const [taxMode, setTaxMode] = useState<TaxMode>(initialData?.taxMode || 'CGST_SGST');
  const [gstRate, setGstRate] = useState<number>(initialData?.gstRate !== undefined ? Number(initialData.gstRate) : 18);

  // Additional Charges
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalChargeInput[]>(
    initialData?.additionalCharges && initialData.additionalCharges.length > 0
      ? initialData.additionalCharges.map((ch: any) => ({
          description: ch.description,
          amount: Number(ch.amount) || 0
        }))
      : []
  );

  const [notes, setNotes] = useState(initialData?.notes || '');
  const [termsAndConditions, setTermsAndConditions] = useState(initialData?.termsAndConditions || '');

  // Fetch Customers & Categories
  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/settings').then(r => r.json())
    ])
      .then(([custData, catData, settingsData]) => {
        setCustomers(Array.isArray(custData) ? custData : []);
        setCategories(Array.isArray(catData) ? catData : []);
        if (!initialData?.termsAndConditions && settingsData?.defaultTerms) {
          setTermsAndConditions(settingsData.defaultTerms);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initialData]);

  // Real-time calculation computation
  const calcResult = calculateFinancials({
    items,
    additionalCharges,
    discountType,
    discountValue,
    taxMode,
    gstRate
  });

  // Handle Item Row changes
  const updateItem = (index: number, field: keyof LineItemInput, value: any) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === 'quantity' || field === 'rate') {
        const q = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
        const r = field === 'rate' ? Number(value) || 0 : Number(item.rate) || 0;
        item.amount = Math.round(q * r * 100) / 100;
      }

      next[index] = item;
      return next;
    });
  };

  // Add Item Action
  const addItem = () => {
    const defaultCategory = categories.length > 0 ? categories[0].name : 'Modular Kitchen';
    setItems(prev => [
      ...prev,
      {
        categoryName: defaultCategory,
        type: '',
        description: '',
        quantity: 1,
        unit: 'Nos',
        rate: 0,
        amount: 0
      }
    ]);
  };

  // Duplicate Item Action
  const duplicateItem = (index: number) => {
    setItems(prev => {
      const target = prev[index];
      const duplicated = { ...target };
      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      return next;
    });
  };

  // Delete Item Action
  const deleteItem = (index: number) => {
    if (items.length <= 1) {
      alert('A quotation must contain at least one item.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Additional Charges Handlers
  const addCharge = () => {
    setAdditionalCharges(prev => [...prev, { description: 'Freight & Transportation', amount: 0 }]);
  };

  const updateCharge = (index: number, field: keyof AdditionalChargeInput, value: any) => {
    setAdditionalCharges(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: field === 'amount' ? Number(value) || 0 : value };
      return next;
    });
  };

  const deleteCharge = (index: number) => {
    setAdditionalCharges(prev => prev.filter((_, i) => i !== index));
  };

  // Save Quotation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Customer Name is required. Please type the customer name.');
      return;
    }

    if (!projectName.trim()) {
      setErrorMsg('Please enter a Project Name (e.g. "Mr. Ravi Residence").');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Please add at least one work item.');
      return;
    }

    // Verify rate is entered
    for (let i = 0; i < items.length; i++) {
      if (!items[i].categoryName) {
        setErrorMsg(`Item #${i + 1} is missing a category.`);
        return;
      }
      if (items[i].quantity <= 0) {
        setErrorMsg(`Item #${i + 1} must have a quantity greater than 0.`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAltPhone: customerAltPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        customerCity: customerCity.trim(),
        customerState: customerState.trim(),
        customerPincode: customerPincode.trim(),
        customerGstin: customerGstin.trim(),
        projectName: projectName.trim(),
        projectLocation: projectLocation.trim() || customerAddress.trim(),
        quotationDate,
        validUntil,
        status,
        taxMode,
        discountType,
        discountValue,
        gstRate,
        items,
        additionalCharges,
        notes,
        termsAndConditions
      };

      const url = isEdit ? `/api/quotations/${initialData.id}` : '/api/quotations';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save quotation');
      }

      router.push(`/quotations/${data.id || initialData.id}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-stone-500 text-sm">
        Loading quotation editor...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {isEdit ? `Edit Quotation (${initialData?.quotationNumber})` : 'Create New Quotation'}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Capsule Company — Dynamic item rates & custom scope calculator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/quotations')}
            className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Quotation'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. CUSTOMER CONTACT DETAILS (MANUALLY TYPED — NO DROPDOWNS) */}
      <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C88A6E]"></span>
            <span>Customer Details (Manual Entry)</span>
          </h2>
          <span className="text-[11px] text-stone-400">Type actual customer information</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Customer Name — MUST BE TYPED MANUALLY */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block font-semibold text-stone-700 mb-1">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Type customer name here (e.g. Ravi Kumar, ABC Constructions, Mr. Suresh)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="+91 98860 12345"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* Alternative Phone Number */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Alternative Phone Number
            </label>
            <input
              type="text"
              placeholder="+91 80250 99887"
              value={customerAltPhone}
              onChange={(e) => setCustomerAltPhone(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="customer@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block font-semibold text-stone-700 mb-1">
              Customer / Site Address
            </label>
            <input
              type="text"
              placeholder="Flat / House / Street / Landmark"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* City */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              City
            </label>
            <input
              type="text"
              placeholder="Bengaluru"
              value={customerCity}
              onChange={(e) => setCustomerCity(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* State */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              State
            </label>
            <input
              type="text"
              placeholder="Karnataka"
              value={customerState}
              onChange={(e) => setCustomerState(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* Pincode */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Pincode
            </label>
            <input
              type="text"
              placeholder="560066"
              value={customerPincode}
              onChange={(e) => setCustomerPincode(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* Customer GSTIN */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Customer GSTIN (if applicable)
            </label>
            <input
              type="text"
              placeholder="29ABCDE1234F1Z5"
              value={customerGstin}
              onChange={(e) => setCustomerGstin(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>
        </div>
      </div>

      {/* 2. PROJECT DETAILS GROUP */}
      <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C88A6E]"></span>
            <span>Project Details</span>
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-stone-700">Status: </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs border border-stone-300 rounded px-2 py-1 bg-white font-medium"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Project Name (Free-text typed by user) */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mr. Ravi Residence / ABC Residence"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* Project Location */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Project Location
            </label>
            <input
              type="text"
              placeholder="e.g. Whitefield, Bengaluru"
              value={projectLocation}
              onChange={(e) => setProjectLocation(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* Quotation Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Quotation Date
            </label>
            <input
              type="date"
              value={quotationDate}
              onChange={(e) => setQuotationDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* Valid Until */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Valid Until
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>
        </div>
      </div>

      {/* CORE WORK ITEMS TABLE (ZERO FIXED PRICES, FULLY USER-ENTERED RATES) */}
      <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E8E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2]">
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <span>Work Scope & Line Items</span>
              <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[11px] font-semibold">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter customer-specific custom types, descriptions, units, and rates manually.
            </p>
          </div>

          {/* HIGHLY VISIBLE + ADD ITEM BUTTON */}
          <button
            type="button"
            onClick={addItem}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold tracking-wide shadow-sm hover:shadow transition-all group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>+ ADD ITEM</span>
          </button>
        </div>

        {/* Responsive Table of Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-[#E8E2D9] bg-[#F7F4EE] text-[11px] font-bold uppercase tracking-wider text-stone-600">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 w-48">Category</th>
                <th className="py-3 px-3 w-52">Type (Free Text)</th>
                <th className="py-3 px-3">Description / Specs</th>
                <th className="py-3 px-3 w-24 text-right">Quantity</th>
                <th className="py-3 px-3 w-28">Unit</th>
                <th className="py-3 px-3 w-32 text-right">Rate (₹)</th>
                <th className="py-3 px-3 w-36 text-right">Amount (₹)</th>
                <th className="py-3 px-3 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9] text-xs">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                  <td className="py-3 px-3 text-center text-stone-400 font-mono">
                    {idx + 1}
                  </td>

                  {/* Category Dropdown or Custom */}
                  <td className="py-3 px-3 align-top">
                    <select
                      value={item.categoryName}
                      onChange={(e) => updateItem(idx, 'categoryName', e.target.value)}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white font-medium focus:ring-1 focus:ring-[#C88A6E]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      {!categories.some(c => c.name === item.categoryName) && (
                        <option value={item.categoryName}>{item.categoryName}</option>
                      )}
                    </select>
                  </td>

                  {/* Free-text Type */}
                  <td className="py-3 px-3 align-top">
                    <input
                      type="text"
                      placeholder="e.g. Acrylic Gloss / Sliding"
                      value={item.type}
                      onChange={(e) => updateItem(idx, 'type', e.target.value)}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white focus:ring-1 focus:ring-[#C88A6E]"
                    />
                  </td>

                  {/* Free-text Description */}
                  <td className="py-3 px-3 align-top">
                    <textarea
                      rows={2}
                      placeholder="Specific work specs, materials, hardware brand..."
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white focus:ring-1 focus:ring-[#C88A6E]"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-3 align-top text-right">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white text-right font-mono focus:ring-1 focus:ring-[#C88A6E]"
                    />
                  </td>

                  {/* Unit Selector or Custom */}
                  <td className="py-3 px-3 align-top">
                    <input
                      type="text"
                      list={`units-list-${idx}`}
                      value={item.unit}
                      onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white focus:ring-1 focus:ring-[#C88A6E]"
                      placeholder="Unit"
                    />
                    <datalist id={`units-list-${idx}`}>
                      {COMMON_UNITS.map(u => (
                        <option key={u} value={u} />
                      ))}
                    </datalist>
                  </td>

                  {/* Manual Rate Entry (Strictly NO FIXED PRICES!) */}
                  <td className="py-3 px-3 align-top text-right">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={item.rate || ''}
                      onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white text-right font-mono font-semibold focus:ring-1 focus:ring-[#C88A6E]"
                    />
                  </td>

                  {/* Auto-calculated Amount */}
                  <td className="py-3 px-3 align-top text-right font-mono font-bold text-stone-900">
                    {formatCurrency(item.quantity * item.rate)}
                  </td>

                  {/* Duplicate and Delete Buttons */}
                  <td className="py-3 px-3 align-top text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateItem(idx)}
                        title="Duplicate Item"
                        className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(idx)}
                        title="Delete Item"
                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer with + ADD ITEM button */}
        <div className="p-3 bg-[#FAF7F2] border-t border-[#E8E2D9] flex justify-between items-center">
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#C88A6E] text-[#C88A6E] hover:bg-[#C88A6E] hover:text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Another Work Item</span>
          </button>
          <div className="text-xs text-stone-500 font-medium">
            Subtotal: <span className="font-bold text-stone-900 font-mono">{formatCurrency(calcResult.subtotal)}</span>
          </div>
        </div>
      </div>

      {/* Financial Calculations & Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Additional Charges & Terms */}
        <div className="lg:col-span-7 space-y-6">
          {/* Additional Charges Box */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Other Charges (Transportation, Installation, etc.)
              </h3>
              <button
                type="button"
                onClick={addCharge}
                className="text-xs font-semibold text-[#C88A6E] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Charge</span>
              </button>
            </div>

            {additionalCharges.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No additional charges added.</p>
            ) : (
              <div className="space-y-2">
                {additionalCharges.map((ch, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Charge description (e.g. Transportation, Loading)"
                      value={ch.description}
                      onChange={(e) => updateCharge(idx, 'description', e.target.value)}
                      className="flex-1 text-xs rounded border border-stone-300 p-2 bg-white"
                    />
                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-2 text-xs text-stone-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={ch.amount || ''}
                        onChange={(e) => updateCharge(idx, 'amount', e.target.value)}
                        className="w-full text-xs rounded border border-stone-300 p-2 pl-6 bg-white text-right font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCharge(idx)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes & Terms Box */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Project Specific Notes
              </label>
              <textarea
                rows={2}
                placeholder="Special instructions, warranty details or client preferences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Terms and Conditions
              </label>
              <textarea
                rows={4}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right Side: LIVE FINANCIAL CALCULATION BREAKDOWN */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-4 sticky top-20">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#C88A6E]" />
              Real-time Financial Summary
            </h3>

            {/* Subtotal */}
            <div className="flex justify-between items-center text-xs py-1 border-b border-stone-100">
              <span className="text-stone-600 font-medium">Subtotal ({items.length} items)</span>
              <span className="font-mono font-semibold text-stone-900">
                {formatCurrency(calcResult.subtotal)}
              </span>
            </div>

            {/* Discount Configuration */}
            <div className="py-2 border-b border-stone-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-600 font-medium">Discount</span>
                <span className="font-mono font-semibold text-rose-600">
                  - {formatCurrency(calcResult.discountAmount)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className="text-xs rounded border border-stone-300 p-1.5 bg-white"
                >
                  <option value="NONE">No Discount</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
                {discountType !== 'NONE' && (
                  <input
                    type="number"
                    min="0"
                    placeholder={discountType === 'PERCENTAGE' ? 'Discount %' : 'Discount ₹'}
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                    className="text-xs rounded border border-stone-300 p-1.5 bg-white font-mono text-right"
                  />
                )}
              </div>
            </div>

            {/* Taxable Amount */}
            <div className="flex justify-between items-center text-xs py-1 border-b border-stone-100">
              <span className="text-stone-600 font-semibold">Taxable Amount</span>
              <span className="font-mono font-bold text-stone-900">
                {formatCurrency(calcResult.taxableAmount)}
              </span>
            </div>

            {/* GST Tax Mode & Rate Selector */}
            <div className="py-2 border-b border-stone-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-600 font-medium">Tax Mode & GST</span>
                <span className="font-mono font-semibold text-stone-900">
                  {formatCurrency(calcResult.cgstAmount + calcResult.sgstAmount + calcResult.igstAmount)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={taxMode}
                  onChange={(e) => setTaxMode(e.target.value as TaxMode)}
                  className="text-xs rounded border border-stone-300 p-1.5 bg-white"
                >
                  <option value="CGST_SGST">CGST + SGST</option>
                  <option value="IGST">IGST (Inter-state)</option>
                  <option value="EXEMPT">Tax Exempt / None</option>
                </select>
                {taxMode !== 'EXEMPT' && (
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="text-xs rounded border border-stone-300 p-1.5 bg-white font-mono"
                  >
                    <option value={0}>0% GST</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST (Standard)</option>
                    <option value={28}>28% GST</option>
                  </select>
                )}
              </div>

              {/* Tax Breakdowns */}
              {taxMode === 'CGST_SGST' && (
                <div className="space-y-1 pt-1 text-[11px] text-stone-500 font-mono">
                  <div className="flex justify-between">
                    <span>CGST ({gstRate / 2}%):</span>
                    <span>{formatCurrency(calcResult.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST ({gstRate / 2}%):</span>
                    <span>{formatCurrency(calcResult.sgstAmount)}</span>
                  </div>
                </div>
              )}
              {taxMode === 'IGST' && (
                <div className="pt-1 text-[11px] text-stone-500 font-mono flex justify-between">
                  <span>IGST ({gstRate}%):</span>
                  <span>{formatCurrency(calcResult.igstAmount)}</span>
                </div>
              )}
            </div>

            {/* Other Charges */}
            {calcResult.otherChargesAmount > 0 && (
              <div className="flex justify-between items-center text-xs py-1 border-b border-stone-100">
                <span className="text-stone-600 font-medium">Other Charges</span>
                <span className="font-mono font-semibold text-stone-900">
                  {formatCurrency(calcResult.otherChargesAmount)}
                </span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-2">
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D9] space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Grand Total
                  </span>
                  <span className="text-xl font-black text-[#171514] font-mono">
                    {formatCurrency(calcResult.roundedGrandTotal)}
                  </span>
                </div>
                {calcResult.grandTotal !== calcResult.roundedGrandTotal && (
                  <div className="text-[11px] text-stone-400 text-right font-mono">
                    Exact: {formatCurrency(calcResult.grandTotal)}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Processing...' : isEdit ? 'Update Quotation' : 'Save Quotation'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
