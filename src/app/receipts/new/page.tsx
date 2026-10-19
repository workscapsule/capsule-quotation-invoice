'use client';

import React, { Suspense } from 'react';
import AppShell from '@/components/AppShell';
import ReceiptEditor from '@/components/ReceiptEditor';

export default function NewReceiptPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-12 text-center text-stone-500">Loading editor...</div>}>
        <ReceiptEditor />
      </Suspense>
    </AppShell>
  );
}
