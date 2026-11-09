'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import QuotationEditor from '@/components/QuotationEditor';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotation = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotations/${id}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to load quotation');
      }
      setQuotation(data);
    } catch (err: any) {
      console.error('Error fetching quotation for edit:', err);
      setError(err.message || 'Unable to load quotation for editing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-20 text-stone-500 text-sm">
          Loading quotation for editing...
        </div>
      </AppShell>
    );
  }

  if (error || !quotation) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-stone-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">Unable to Load Quotation</h2>
          <p className="text-sm text-stone-600 max-w-md mx-auto">{error || 'Quotation not found'}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fetchQuotation()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
            <button
              onClick={() => router.push('/quotations')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Quotations
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QuotationEditor initialData={quotation} isEdit={true} />
    </AppShell>
  );
}
