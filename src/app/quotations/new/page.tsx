'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import QuotationEditor from '@/components/QuotationEditor';

export default function NewQuotationPage() {
  return (
    <AppShell>
      <QuotationEditor />
    </AppShell>
  );
}
