'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ReceiptEditor from '@/components/ReceiptEditor';
import { AlertCircle } from 'lucide-react';

export default function EditReceiptPage() {
  const params = useParams();
  const id = params?.id as string;

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/receipts/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Receipt not found');
        return res.json();
      })
      .then(data => setReceipt(data))
      .catch(err => setError(err.message || 'Error loading receipt'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-stone-500 bg-white rounded-xl border border-stone-200">
          Loading receipt details...
        </div>
      </AppShell>
    );
  }

  if (error || !receipt) {
    return (
      <AppShell>
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error || 'Receipt not found'}</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ReceiptEditor initialData={receipt} isEdit={true} />
    </AppShell>
  );
}
