'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import InvoiceEditor from '@/components/InvoiceEditor';

export default function NewInvoicePage() {
  return (
    <AppShell>
      <InvoiceEditor />
    </AppShell>
  );
}
