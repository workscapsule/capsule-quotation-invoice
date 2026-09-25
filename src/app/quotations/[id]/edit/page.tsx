'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import QuotationEditor from '@/components/QuotationEditor';

export default function EditQuotationPage() {
  const params = useParams();
  const id = params?.id as string;
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/quotations/${id}`)
      .then(res => res.json())
      .then(data => setQuotation(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !quotation) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-20 text-stone-500 text-sm">
          Loading quotation for editing...
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
