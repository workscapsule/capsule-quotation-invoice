'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import DocumentViewer from '@/components/DocumentViewer';
import { ArrowLeft } from 'lucide-react';

export default function QuotationViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuotation = () => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/quotations/${id}`)
      .then(res => res.json())
      .then(data => setQuotation(data))
      .catch(console.error)
      .finally(() => setLoading(false));
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

  if (loading || !quotation) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-20 text-stone-500 text-sm">
          Loading quotation document...
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
