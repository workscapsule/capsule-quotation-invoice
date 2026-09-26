'use client';

import React, { useState } from 'react';
import { X, Check, Image as ImageIcon, Sparkles, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { PRODUCT_IMAGE_PRESETS, resolveProductImage, ProductImagePreset } from '@/lib/productImages';

interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage?: string;
  categoryName?: string;
  type?: string;
  description?: string;
  onSelectImage: (imageUrl: string) => void;
}

export default function ProductImageModal({
  isOpen,
  onClose,
  currentImage,
  categoryName,
  type,
  description,
  onSelectImage
}: ProductImageModalProps) {
  if (!isOpen) return null;

  const resolvedDefault = resolveProductImage(categoryName, type, description);
  const activeImage = currentImage || resolvedDefault;

  const [selectedUrl, setSelectedUrl] = useState(activeImage);
  const [customInput, setCustomInput] = useState(
    currentImage && !PRODUCT_IMAGE_PRESETS.some(p => p.url === currentImage) ? currentImage : ''
  );
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(PRODUCT_IMAGE_PRESETS.map(p => p.category)))];

  const filteredPresets = filterCategory === 'ALL'
    ? PRODUCT_IMAGE_PRESETS
    : PRODUCT_IMAGE_PRESETS.filter(p => p.category === filterCategory);

  const handleApplyAuto = () => {
    const auto = resolveProductImage(categoryName, type, description);
    setSelectedUrl(auto);
  };

  const handleConfirm = () => {
    onSelectImage(selectedUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C88A6E]/10 border border-[#C88A6E]/30 flex items-center justify-center text-[#B37356]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Select Product Image</h3>
              <p className="text-xs text-stone-500">
                Category: <span className="font-semibold text-stone-700">{categoryName || 'General'}</span>
                {type ? ` • Type: ${type}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Preview & Quick Actions */}
        <div className="p-4 bg-amber-50/40 border-b border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-[#C88A6E] shrink-0 bg-stone-100 shadow-xs">
              <img
                src={selectedUrl || '/products/modular-kitchen.jpg'}
                alt="Selected"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B37356] block">
                Selected Product Image
              </span>
              <p className="text-xs font-semibold text-stone-800 line-clamp-1">
                {PRODUCT_IMAGE_PRESETS.find(p => p.url === selectedUrl)?.name || 'Custom / Specific Image'}
              </p>
              <p className="text-[11px] text-stone-500">
                This image will appear in the line item, quotation/invoice viewer, and PDF export.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyAuto}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#C88A6E]/40 text-[#B37356] hover:bg-[#C88A6E]/10 text-xs font-semibold shadow-xs shrink-0 transition-all"
            title="Auto-detect most suitable image based on Category and Specifications"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Auto-Match</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2.5 border-b border-stone-100 bg-white overflow-x-auto flex items-center gap-1.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of Presets */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-[#FAF8F5]">
          {filteredPresets.map((preset) => {
            const isSelected = selectedUrl === preset.url;
            return (
              <div
                key={preset.id}
                onClick={() => setSelectedUrl(preset.url)}
                className={`group relative rounded-xl border-2 overflow-hidden bg-white cursor-pointer transition-all duration-150 flex flex-col ${
                  isSelected
                    ? 'border-[#C88A6E] ring-2 ring-[#C88A6E]/30 shadow-md'
                    : 'border-stone-200 hover:border-stone-400 hover:shadow-xs'
                }`}
              >
                <div className="aspect-4/3 w-full bg-stone-100 overflow-hidden relative">
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C88A6E] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
                    {preset.category}
                  </span>
                </div>
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <p className="text-xs font-bold text-stone-900 group-hover:text-[#B37356] transition-colors leading-tight line-clamp-1">
                    {preset.name}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom URL Input Section */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Or enter custom image URL (e.g. https://... or /products/...)"
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value);
              if (e.target.value.trim()) {
                setSelectedUrl(e.target.value.trim());
              }
            }}
            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-[#C88A6E]"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors"
          >
            Apply Image
          </button>
        </div>
      </div>
    </div>
  );
}
