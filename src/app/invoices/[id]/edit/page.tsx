'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import InvoiceEditor from '@/components/InvoiceEditor';

export default function EditInvoicePage() {
  const params = useParams();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/invoices/${id}`)
      .then(res => res.json())
      .then(data => setInvoice(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !invoice) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-20 text-stone-500 text-sm">
          Loading invoice for editing...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <InvoiceEditor initialData={invoice} isEdit={true} />
    </AppShell>
  );
}
