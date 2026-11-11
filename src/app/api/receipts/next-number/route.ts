import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getNextReceiptNumber } from '@/lib/numbering';

export async function GET() {
  try {
    const companySettings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    const prefix = companySettings?.receiptPrefix || 'CAP-REC-';
    const nextNumber = await getNextReceiptNumber(prefix);
    return NextResponse.json({ nextNumber, prefix });
  } catch (error) {
    console.error('Error getting next receipt number:', error);
    return NextResponse.json({ nextNumber: 'CAP-REC-0001' });
  }
}
