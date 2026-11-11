import { prisma } from './prisma';

/**
 * Returns the next unique, strictly ascending quotation number (e.g. CAP-QTN-0007).
 * It calculates the maximum existing number among all quotations to never collide or reuse past numbers.
 */
export async function getNextQuotationNumber(customPrefix?: string): Promise<string> {
  let prefix = customPrefix;
  if (!prefix) {
    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    prefix = settings?.quotationPrefix || 'CAP-QTN-';
  }

  const allQuotes = await prisma.quotation.findMany({ select: { quotationNumber: true } });
  let maxNum = 0;
  for (const q of allQuotes) {
    const match = q.quotationNumber.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  let nextSeq = maxNum + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  while (await prisma.quotation.findUnique({ where: { quotationNumber: candidate } })) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }
  return candidate;
}

/**
 * Returns the next unique, strictly ascending invoice number (e.g. CAP-INV-0002).
 */
export async function getNextInvoiceNumber(customPrefix?: string): Promise<string> {
  let prefix = customPrefix;
  if (!prefix) {
    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    prefix = settings?.invoicePrefix || 'CAP-INV-';
  }

  const allInvoices = await prisma.invoice.findMany({ select: { invoiceNumber: true } });
  let maxNum = 0;
  for (const inv of allInvoices) {
    const match = inv.invoiceNumber.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  let nextSeq = maxNum + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  while (await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } })) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }
  return candidate;
}

/**
 * Returns the next unique, strictly ascending receipt number (e.g. CAP-REC-0001).
 */
export async function getNextReceiptNumber(customPrefix?: string): Promise<string> {
  let prefix = customPrefix;
  if (!prefix) {
    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    prefix = settings?.receiptPrefix || 'CAP-REC-';
  }

  const allReceipts = await prisma.paymentReceipt.findMany({ select: { receiptNumber: true } });
  let maxNum = 0;
  for (const r of allReceipts) {
    const match = r.receiptNumber.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  let nextSeq = maxNum + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  while (await prisma.paymentReceipt.findUnique({ where: { receiptNumber: candidate } })) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }
  return candidate;
}

/**
 * Returns the next unique customer ID (e.g. CUST-006).
 */
export async function getNextCustomerId(): Promise<string> {
  const allCusts = await prisma.customer.findMany({ select: { customerId: true } });
  let maxNum = 0;
  for (const c of allCusts) {
    const match = c.customerId.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  let nextSeq = maxNum + 1;
  let candidate = `CUST-${String(nextSeq).padStart(3, '0')}`;
  while (await prisma.customer.findUnique({ where: { customerId: candidate } })) {
    nextSeq++;
    candidate = `CUST-${String(nextSeq).padStart(3, '0')}`;
  }
  return candidate;
}

/**
 * Returns the next unique project ID (e.g. PRJ-006).
 */
export async function getNextProjectId(): Promise<string> {
  const allProjs = await prisma.project.findMany({ select: { projectId: true } });
  let maxNum = 0;
  for (const p of allProjs) {
    const match = p.projectId.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  let nextSeq = maxNum + 1;
  let candidate = `PRJ-${String(nextSeq).padStart(3, '0')}`;
  while (await prisma.project.findUnique({ where: { projectId: candidate } })) {
    nextSeq++;
    candidate = `PRJ-${String(nextSeq).padStart(3, '0')}`;
  }
  return candidate;
}
