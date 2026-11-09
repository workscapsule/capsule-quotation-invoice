'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import DocumentViewer from '@/components/DocumentViewer';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

export default function QuotationViewPage() {
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
      console.error('Error loading quotation:', err);
      setError(err.message || 'Unable to load quotation document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setQuotation((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-20 text-stone-500 text-sm">
          Loading quotation document...
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
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            {error || 'The requested quotation could not be found or the service is temporarily unavailable.'}
          </p>
          <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-800 text-left border border-amber-200">
            <span className="font-semibold block mb-0.5">Database Notice:</span>
            If you are seeing connection or database errors, your Supabase project may be paused due to inactivity. Check your Supabase Dashboard and click <strong>Restore project</strong> to reactivate it.
          </div>
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
      <div className="space-y-6">
        <div className="no-print">
          <button
            onClick={() => router.push('/quotations')}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Quotations</span>
          </button>
        </div>

        <DocumentViewer
          type="QUOTATION"
          data={quotation}
          onStatusChange={handleStatusChange}
        />
      </div>
    </AppShell>
  );
}
