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
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { calculateFinancials, LineItemInput, AdditionalChargeInput, TaxMode, DiscountType } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';
import { resolveProductImage } from '@/lib/productImages';
import ProductImageModal from '@/components/ProductImageModal';

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

interface InvoiceEditorProps {
  initialData?: any;
  isEdit?: boolean;
}

const COMMON_UNITS = ['Sq.ft', 'Nos', 'R.ft', 'Sq.m', 'Kg', 'Set', 'Lump Sum', 'Hours', 'Days', 'Custom'];

export default function InvoiceEditor({ initialData, isEdit = false }: InvoiceEditorProps) {
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
  const [invoiceDate, setInvoiceDate] = useState(
    initialData?.invoiceDate ? new Date(initialData.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split('T')[0]
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Modal state for selecting / previewing product image
  const [imageModalItemIndex, setImageModalItemIndex] = useState<number | null>(null);

  // Items State (Manual rates, free-text type & description)
  const [items, setItems] = useState<LineItemInput[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items.map((it: any) => ({
          categoryId: it.categoryId || null,
          categoryName: it.categoryName || 'General',
          imageUrl: it.imageUrl || null,
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
            imageUrl: '/products/modular-kitchen.jpg',
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

  const totalPaidSoFar = Number(initialData?.totalPaid) || 0;

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

  const calcResult = calculateFinancials({
    items,
    additionalCharges,
    discountType,
    discountValue,
    taxMode,
    gstRate,
    totalPaid: totalPaidSoFar,
    dueDate
  });

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

  const addItem = () => {
    const defaultCategory = categories.length > 0 ? categories[0].name : 'Modular Kitchen';
    setItems(prev => [
      ...prev,
      {
        categoryName: defaultCategory,
        imageUrl: resolveProductImage(defaultCategory, '', ''),
        type: '',
        description: '',
        quantity: 1,
        unit: 'Nos',
        rate: 0,
        amount: 0
      }
    ]);
  };

  const duplicateItem = (index: number) => {
    setItems(prev => {
      const target = prev[index];
      const duplicated = { ...target };
      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      return next;
    });
  };

  const deleteItem = (index: number) => {
    if (items.length <= 1) {
      alert('An invoice must contain at least one item.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const resolvedCustName = customerName.trim() || 'Valued Client';
    const resolvedProjName = projectName.trim() || `${resolvedCustName} Project`;

    const cleanedItems = items.length === 0
      ? [{ categoryName: 'Modular Kitchen', imageUrl: '/products/modular-kitchen.jpg', type: 'Work Item', description: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }]
      : items.map(it => ({
          ...it,
          categoryName: it.categoryName?.trim() || 'General',
          imageUrl: it.imageUrl || resolveProductImage(it.categoryName, it.type, it.description),
          type: it.type || '',
          description: it.description || '',
          quantity: isNaN(Number(it.quantity)) || Number(it.quantity) <= 0 ? 1 : Number(it.quantity),
          unit: it.unit || 'Nos',
          rate: isNaN(Number(it.rate)) ? 0 : Number(it.rate),
          amount: (isNaN(Number(it.quantity)) || Number(it.quantity) <= 0 ? 1 : Number(it.quantity)) * (isNaN(Number(it.rate)) ? 0 : Number(it.rate))
        }));

    setSaving(true);
    try {
      const payload = {
        customerId: initialData?.customerId,
        projectId: initialData?.projectId,
        customerName: resolvedCustName,
        customerPhone: customerPhone.trim(),
        customerAltPhone: customerAltPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        customerCity: customerCity.trim(),
        customerState: customerState.trim(),
        customerPincode: customerPincode.trim(),
        customerGstin: customerGstin.trim(),
        projectName: resolvedProjName,
        projectLocation: projectLocation.trim() || customerAddress.trim(),
        invoiceDate,
        dueDate,
        taxMode,
        discountType,
        discountValue: Number(discountValue) || 0,
        gstRate: Number(gstRate) || 18,
        items: cleanedItems,
        additionalCharges: (additionalCharges || []).filter(c => c && (c.description || c.amount)),
        notes,
        termsAndConditions
      };

      const url = isEdit ? `/api/invoices/${initialData.id}` : '/api/invoices';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to save invoice`);
      }

      router.push(`/invoices/${data.id || initialData.id}`);
      router.refresh();
    } catch (err: any) {
      console.error('Error saving invoice:', err);
      setErrorMsg(err.message || 'Error occurred while saving invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-stone-500 text-sm">
        Loading invoice editor...
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
              {isEdit ? `Edit Tax Invoice (${initialData?.invoiceNumber})` : 'Create Tax Invoice'}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Capsule Company — Billing & financial invoice generator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/invoices')}
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
            <span>{saving ? 'Saving...' : 'Save Invoice'}</span>
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

          {/* Invoice Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
            />
          </div>
        </div>
      </div>

      {/* WORK ITEMS TABLE (MANUALLY ENTERED RATES, FREE-TEXT TYPE & DESCRIPTION) */}
      <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E8E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2]">
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <span>Invoice Items</span>
              <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[11px] font-semibold">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter custom types, work specifications, units, and rates manually.
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

        {/* Responsive Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-[#E8E2D9] bg-[#F7F4EE] text-[11px] font-bold uppercase tracking-wider text-stone-600">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 w-44">Category</th>
                <th className="py-3 px-2 w-28 text-center">Product Image</th>
                <th className="py-3 px-3 w-48">Type (Free Text)</th>
                <th className="py-3 px-3">Description / Specs</th>
                <th className="py-3 px-3 w-24 text-right">Quantity</th>
                <th className="py-3 px-3 w-28">Unit</th>
                <th className="py-3 px-3 w-32 text-right">Rate (₹)</th>
                <th className="py-3 px-3 w-36 text-right">Amount (₹)</th>
                <th className="py-3 px-3 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9] text-xs">
              {items.map((item, idx) => {
                const currentImg = item.imageUrl || resolveProductImage(item.categoryName, item.type, item.description);
                return (
                <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                  <td className="py-3 px-3 text-center text-stone-400 font-mono">
                    {idx + 1}
                  </td>

                  <td className="py-3 px-3 align-top">
                    <select
                      value={item.categoryName}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        updateItem(idx, 'categoryName', newCat);
                        if (!item.imageUrl) {
                          updateItem(idx, 'imageUrl', resolveProductImage(newCat, item.type, item.description));
                        }
                      }}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white font-medium"
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

                  {/* Product Image Column */}
                  <td className="py-3 px-2 align-top text-center">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setImageModalItemIndex(idx)}
                        className="relative group w-16 h-12 rounded-lg overflow-hidden border border-stone-300 hover:border-[#C88A6E] shadow-2xs hover:shadow-md bg-stone-100 transition-all focus:outline-hidden focus:ring-2 focus:ring-[#C88A6E]"
                        title="Click to view full image or choose from gallery"
                      >
                        <img
                          src={currentImg}
                          alt={item.categoryName || 'Product'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ImageIcon className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageModalItemIndex(idx)}
                        className="text-[10px] text-[#B37356] hover:text-[#8E4B2F] font-semibold flex items-center gap-0.5"
                      >
                        <span>Change</span>
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-3 align-top">
                    <input
                      type="text"
                      placeholder="e.g. Acrylic Gloss / Sliding"
                      value={item.type}
                      onChange={(e) => updateItem(idx, 'type', e.target.value)}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white"
                    />
                  </td>

                  <td className="py-3 px-3 align-top">
                    <textarea
                      rows={2}
                      placeholder="Detailed work specs..."
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white"
                    />
                  </td>

                  <td className="py-3 px-3 align-top text-right">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white text-right font-mono"
                    />
                  </td>

                  <td className="py-3 px-3 align-top">
                    <input
                      type="text"
                      list={`units-list-inv-${idx}`}
                      value={item.unit}
                      onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white"
                      placeholder="Unit"
                    />
                    <datalist id={`units-list-inv-${idx}`}>
                      {COMMON_UNITS.map(u => (
                        <option key={u} value={u} />
                      ))}
                    </datalist>
                  </td>

                  {/* Strictly manual rate entry */}
                  <td className="py-3 px-3 align-top text-right">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={item.rate || ''}
                      onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                      className="w-full text-xs rounded border border-stone-300 p-1.5 bg-white text-right font-mono font-semibold"
                    />
                  </td>

                  <td className="py-3 px-3 align-top text-right font-mono font-bold text-stone-900">
                    {formatCurrency(item.quantity * item.rate)}
                  </td>

                  <td className="py-3 px-3 align-top text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateItem(idx)}
                        title="Duplicate Item"
                        className="p-1 text-stone-400 hover:text-stone-700 rounded"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(idx)}
                        title="Delete Item"
                        className="p-1 text-stone-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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

      {/* Financial Breakdown Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Other Charges
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
                      placeholder="Charge description"
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

          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
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

        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-4 sticky top-20">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#C88A6E]" />
              Real-time Invoice Summary
            </h3>

            <div className="flex justify-between items-center text-xs py-1 border-b border-stone-100">
              <span className="text-stone-600 font-medium">Subtotal ({items.length} items)</span>
              <span className="font-mono font-semibold text-stone-900">
                {formatCurrency(calcResult.subtotal)}
              </span>
            </div>

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
                    placeholder="Discount value"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                    className="text-xs rounded border border-stone-300 p-1.5 bg-white font-mono text-right"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs py-1 border-b border-stone-100">
              <span className="text-stone-600 font-semibold">Taxable Amount</span>
              <span className="font-mono font-bold text-stone-900">
                {formatCurrency(calcResult.taxableAmount)}
              </span>
            </div>

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
                  <option value="EXEMPT">Tax Exempt</option>
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
            </div>

            {calcResult.otherChargesAmount > 0 && (
              <div className="flex justify-between items-center text-xs py-1 border-b border-stone-100">
                <span className="text-stone-600 font-medium">Other Charges</span>
                <span className="font-mono font-semibold text-stone-900">
                  {formatCurrency(calcResult.otherChargesAmount)}
                </span>
              </div>
            )}

            <div className="pt-2">
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Grand Total
                  </span>
                  <span className="text-xl font-black text-[#171514] font-mono">
                    {formatCurrency(calcResult.roundedGrandTotal)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-xs pt-1 border-t border-stone-200">
                  <span className="text-stone-600 font-semibold">Total Paid</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatCurrency(totalPaidSoFar)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-stone-700 font-bold">Balance Due</span>
                  <span className="font-mono font-black text-rose-600 text-sm">
                    {formatCurrency(calcResult.balanceDue)}
                  </span>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">Status:</span>
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-amber-100 text-amber-800">
                    {calcResult.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Processing...' : isEdit ? 'Update Invoice' : 'Save Invoice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Image Selection & Preview Modal */}
      {imageModalItemIndex !== null && items[imageModalItemIndex] && (
        <ProductImageModal
          isOpen={true}
          onClose={() => setImageModalItemIndex(null)}
          currentImage={items[imageModalItemIndex].imageUrl || undefined}
          categoryName={items[imageModalItemIndex].categoryName}
          type={items[imageModalItemIndex].type}
          description={items[imageModalItemIndex].description}
          onSelectImage={(newUrl) => {
            updateItem(imageModalItemIndex, 'imageUrl', newUrl);
          }}
        />
      )}
    </form>
  );
}
