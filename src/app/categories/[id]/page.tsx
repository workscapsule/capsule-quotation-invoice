'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Save,
  Calculator,
  User,
  FolderKanban,
  MapPin,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Building,
  Layers
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

export default function CategoryProjectItemEntryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params?.id as string;

  const [category, setCategory] = useState<any>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. CUSTOMER CONTACT DETAILS (MANUALLY TYPED — NO DROPDOWNS)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAltPhone, setCustomerAltPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('Bengaluru');
  const [customerState, setCustomerState] = useState('Karnataka');
  const [customerPincode, setCustomerPincode] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  // 2. PROJECT DETAILS (MANUALLY TYPED)
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // 2. WORK ITEMS (Multiple items, free-text Type & Description, manual Rate, flexible Unit)
  const [items, setItems] = useState<LineItemInput[]>([]);

  // 3. FINANCIAL TOTALS
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxMode, setTaxMode] = useState<TaxMode>('CGST_SGST');
  const [gstRate, setGstRate] = useState<number>(18);
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalChargeInput[]>([]);
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/categories/${categoryId}`).then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/settings').then(r => r.json())
    ])
      .then(([catData, allCats, custData, settingsData]) => {
        setCategory(catData);
        setCategories(Array.isArray(allCats) ? allCats : []);
        setCustomers(Array.isArray(custData) ? custData : []);

        const initialCategoryName = catData?.name || 'Modular Kitchen';
        // Initialize with 1 empty item pre-filled with this category
        setItems([
          {
            categoryName: initialCategoryName,
            type: '',
            description: '',
            quantity: 1,
            unit: 'Sq.ft',
            rate: 0,
            amount: 0
          }
        ]);

        if (settingsData?.defaultTerms) {
          setTermsAndConditions(settingsData.defaultTerms);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryId]);

  // Real-time calculations
  const calcResult = calculateFinancials({
    items,
    additionalCharges,
    discountType,
    discountValue,
    taxMode,
    gstRate
  });

  // Line item handlers
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

  // Highly visible + ADD ITEM
  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        categoryName: category?.name || (categories[0]?.name || 'Modular Kitchen'),
        type: '',
        description: '',
        quantity: 1,
        unit: 'Sq.ft',
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
      alert('A quotation must contain at least one item.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Additional charges handlers
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
        status: 'DRAFT',
        taxMode,
        discountType,
        discountValue,
        gstRate,
        items,
        additionalCharges,
        notes,
        termsAndConditions
      };

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save quotation');
      }

      // Navigate to the created Quotation Document View
      router.push(`/quotations/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-20 text-stone-500 text-sm">
          Loading project item entry screen...
        </div>
      </AppShell>
    );
  }

  const categoryName = category?.name || 'Modular Kitchen';

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/categories')}
              className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#FAF7F2] text-[#C88A6E] border border-[#C88A6E]">
                  Main Category
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  {categoryName} – Project Item Entry
                </h1>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Capsule Company — Enter project-specific work items, custom types, descriptions, units, and rates manually.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/categories')}
              className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Back to Categories
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Creating Quotation...' : 'Save Quotation & View Document'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. CUSTOMER CONTACT DETAILS (MANUAL ENTRY — NO DROPDOWNS) */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
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
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-semibold text-stone-900 focus:ring-2 focus:ring-[#C88A6E]"
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
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
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
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
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
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
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
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
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
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
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
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
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
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
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
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
              />
            </div>
          </div>
        </div>

        {/* 2. PROJECT DETAILS GROUP */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#C88A6E]" />
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
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white font-semibold focus:ring-2 focus:ring-[#C88A6E]"
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
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
              />
            </div>

            {/* Quotation Date */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Quotation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
              />
            </div>

            {/* Valid Until */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-[#C88A6E]"
              />
            </div>
          </div>
        </div>

        {/* 2. WORK ITEMS TABLE — PROMINENT + ADD ITEM, USER-ENTERED TYPE, DESCRIPTION, UNIT, RATE */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E8E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2]">
            <div>
              <h2 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C88A6E]" />
                <span>Work Scope & Line Items</span>
                <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[11px] font-semibold">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Type is a free-text input field. Description is free text. Measurement/Unit is flexible. Rate is entered manually.
              </p>
            </div>

            {/* HIGHLY VISIBLE + ADD ITEM BUTTON */}
            <button
              type="button"
              onClick={addItem}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold tracking-wide shadow-sm hover:shadow-md transition-all group"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              <span>+ ADD ITEM</span>
            </button>
          </div>

          {/* Line Items Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-[#E8E2D9] bg-[#F7F4EE] text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 w-48">Category</th>
                  <th className="py-3 px-3 w-60">Type (Free Text Input)</th>
                  <th className="py-3 px-3">Description (Free Text)</th>
                  <th className="py-3 px-3 w-28 text-right">Quantity</th>
                  <th className="py-3 px-3 w-32">Measurement / Unit</th>
                  <th className="py-3 px-3 w-32 text-right">Rate / Price (₹)</th>
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

                    {/* Category Dropdown (Defaults to category clicked, allows any category) */}
                    <td className="py-3 px-3 align-top">
                      <select
                        value={item.categoryName}
                        onChange={(e) => updateItem(idx, 'categoryName', e.target.value)}
                        className="w-full text-xs rounded-lg border border-stone-300 p-2 bg-white font-medium focus:ring-1 focus:ring-[#C88A6E]"
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

                    {/* TYPE — FREE TEXT INPUT FIELD (NO FIXED OPTIONS) */}
                    <td className="py-3 px-3 align-top">
                      <input
                        type="text"
                        placeholder="e.g. Full height kitchen with island / Parallel modular kitchen"
                        value={item.type}
                        onChange={(e) => updateItem(idx, 'type', e.target.value)}
                        className="w-full text-xs rounded-lg border border-stone-300 p-2 bg-white font-medium focus:ring-1 focus:ring-[#C88A6E]"
                      />
                    </td>

                    {/* DESCRIPTION — LARGE TEXTAREA */}
                    <td className="py-3 px-3 align-top">
                      <textarea
                        rows={2}
                        placeholder="Full modular kitchen with overhead cabinets, base units, countertop and required accessories..."
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        className="w-full text-xs rounded-lg border border-stone-300 p-2 bg-white focus:ring-1 focus:ring-[#C88A6E]"
                      />
                    </td>

                    {/* QUANTITY — USER ENTERED (ALLOWS DECIMALS) */}
                    <td className="py-3 px-3 align-top text-right">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        className="w-full text-xs rounded-lg border border-stone-300 p-2 bg-white text-right font-mono font-medium focus:ring-1 focus:ring-[#C88A6E]"
                      />
                    </td>

                    {/* MEASUREMENT / UNIT — USER ENTERED FREE TEXT */}
                    <td className="py-3 px-3 align-top">
                      <input
                        type="text"
                        placeholder="Sq.ft / Running Feet / Nos"
                        value={item.unit}
                        onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                        className="w-full text-xs rounded-lg border border-stone-300 p-2 bg-white focus:ring-1 focus:ring-[#C88A6E]"
                      />
                    </td>

                    {/* RATE / PRICE — STRICTLY MANUAL ENTRY (NO FIXED PRICES) */}
                    <td className="py-3 px-3 align-top text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={item.rate || ''}
                        onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                        className="w-full text-xs rounded-lg border border-stone-300 p-2 bg-white text-right font-mono font-bold text-stone-900 focus:ring-1 focus:ring-[#C88A6E]"
                      />
                    </td>

                    {/* AMOUNT — AUTOMATICALLY CALCULATED (QUANTITY * RATE) */}
                    <td className="py-3 px-3 align-top text-right font-mono font-black text-stone-900 text-sm">
                      {formatCurrency(item.quantity * item.rate)}
                    </td>

                    {/* ROW ACTIONS */}
                    <td className="py-3 px-3 align-top text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateItem(idx)}
                          title="Duplicate Item"
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(idx)}
                          title="Delete Item"
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
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

          {/* Table Footer with + ADD ITEM Button */}
          <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E2D9] flex justify-between items-center">
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#C88A6E] text-[#C88A6E] hover:bg-[#C88A6E] hover:text-white text-xs font-bold transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Work Item</span>
            </button>
            <div className="text-xs text-stone-500 font-medium">
              Subtotal: <span className="font-bold text-stone-900 font-mono text-sm">{formatCurrency(calcResult.subtotal)}</span>
            </div>
          </div>
        </div>

        {/* 3. FINANCIAL TOTALS, CHARGES & SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Other Charges Box */}
            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Other Charges (Transportation, Installation, Delivery, etc.)
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
                        placeholder="Charge description (e.g. Transportation, Installation)"
                        value={ch.description}
                        onChange={(e) => updateCharge(idx, 'description', e.target.value)}
                        className="flex-1 text-xs rounded-lg border border-stone-300 p-2 bg-white"
                      />
                      <div className="relative w-36">
                        <span className="absolute left-2.5 top-2 text-xs text-stone-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0.00"
                          value={ch.amount || ''}
                          onChange={(e) => updateCharge(idx, 'amount', e.target.value)}
                          className="w-full text-xs rounded-lg border border-stone-300 p-2 pl-6 bg-white text-right font-mono"
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
                  Project Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions or customer preferences..."
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

          {/* Right Column: Live Calculation Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xs space-y-4 sticky top-20">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#C88A6E]" />
                <span>Financial Totals</span>
              </h3>

              {/* Subtotal */}
              <div className="flex justify-between items-center text-xs py-1 border-b border-stone-100">
                <span className="text-stone-600 font-medium">Subtotal ({items.length} items)</span>
                <span className="font-mono font-semibold text-stone-900">
                  {formatCurrency(calcResult.subtotal)}
                </span>
              </div>

              {/* Discount */}
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
                    className="text-xs rounded-lg border border-stone-300 p-1.5 bg-white"
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
                      className="text-xs rounded-lg border border-stone-300 p-1.5 bg-white font-mono text-right"
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

              {/* GST Tax Mode & Rate */}
              <div className="py-2 border-b border-stone-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-medium">GST Tax</span>
                  <span className="font-mono font-semibold text-stone-900">
                    {formatCurrency(calcResult.cgstAmount + calcResult.sgstAmount + calcResult.igstAmount)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={taxMode}
                    onChange={(e) => setTaxMode(e.target.value as TaxMode)}
                    className="text-xs rounded-lg border border-stone-300 p-1.5 bg-white"
                  >
                    <option value="CGST_SGST">CGST + SGST</option>
                    <option value="IGST">IGST (Inter-state)</option>
                    <option value="EXEMPT">Tax Exempt</option>
                  </select>
                  {taxMode !== 'EXEMPT' && (
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="text-xs rounded-lg border border-stone-300 p-1.5 bg-white font-mono"
                    >
                      <option value={0}>0% GST</option>
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST (Standard)</option>
                      <option value={28}>28% GST</option>
                    </select>
                  )}
                </div>

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
                className="w-full py-3.5 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Processing...' : 'Save Quotation & View Document'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
