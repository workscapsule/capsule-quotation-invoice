import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const companySettings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    const prefix = companySettings?.receiptPrefix || 'CAP-REC-';

    const count = await prisma.paymentReceipt.count();
    let nextSeq = count + 1;
    let nextNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    while (await prisma.paymentReceipt.findUnique({ where: { receiptNumber: nextNumber } })) {
      nextSeq++;
      nextNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    }

    return NextResponse.json({ nextNumber, prefix, sequence: nextSeq });
  } catch (error) {
    console.error('Error getting next receipt number:', error);
    return NextResponse.json({ nextNumber: 'CAP-REC-0001' });
  }
}
