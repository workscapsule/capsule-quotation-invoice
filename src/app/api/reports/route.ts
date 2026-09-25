import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const invoiceWhere: any = {};
    if (startDate || endDate) invoiceWhere.invoiceDate = dateFilter;

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        customer: true,
        project: true,
        items: true,
        payments: true
      },
      orderBy: { invoiceDate: 'desc' }
    });

    const quotations = await prisma.quotation.findMany({
      where: startDate || endDate ? { quotationDate: dateFilter } : {},
      include: {
        customer: true,
        project: true,
        items: true
      },
      orderBy: { quotationDate: 'desc' }
    });

    // Category analysis
    const categoryStats: Record<string, { category: string; quotationCount: number; quotationValue: number; invoiceCount: number; invoiceValue: number }> = {};

    quotations.forEach(q => {
      q.items.forEach(it => {
        const cat = it.categoryName || 'General';
        if (!categoryStats[cat]) {
          categoryStats[cat] = { category: cat, quotationCount: 0, quotationValue: 0, invoiceCount: 0, invoiceValue: 0 };
        }
        categoryStats[cat].quotationCount += 1;
        categoryStats[cat].quotationValue += it.amount;
      });
    });

    invoices.forEach(inv => {
      inv.items.forEach(it => {
        const cat = it.categoryName || 'General';
        if (!categoryStats[cat]) {
          categoryStats[cat] = { category: cat, quotationCount: 0, quotationValue: 0, invoiceCount: 0, invoiceValue: 0 };
        }
        categoryStats[cat].invoiceCount += 1;
        categoryStats[cat].invoiceValue += it.amount;
      });
    });

    // Tax Liability Breakdown
    const taxSummary = invoices.reduce((acc, inv) => {
      acc.taxableValue += inv.taxableAmount;
      acc.cgst += inv.cgstAmount;
      acc.sgst += inv.sgstAmount;
      acc.igst += inv.igstAmount;
      acc.totalTax += (inv.cgstAmount + inv.sgstAmount + inv.igstAmount);
      return acc;
    }, { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 });

    // Customer Outstanding Report
    const customerOutstanding = await prisma.customer.findMany({
      select: {
        id: true,
        customerId: true,
        name: true,
        phone: true,
        invoices: {
          select: {
            roundedGrandTotal: true,
            totalPaid: true,
            balanceDue: true
          }
        }
      }
    });

    const outstandingReport = customerOutstanding.map(c => {
      const totalBilled = c.invoices.reduce((s, i) => s + i.roundedGrandTotal, 0);
      const totalPaid = c.invoices.reduce((s, i) => s + i.totalPaid, 0);
      const balance = c.invoices.reduce((s, i) => s + i.balanceDue, 0);
      return {
        id: c.id,
        customerId: c.customerId,
        name: c.name,
        phone: c.phone,
        totalBilled,
        totalPaid,
        balance
      };
    }).filter(c => c.totalBilled > 0)
      .sort((a, b) => b.balance - a.balance);

    return NextResponse.json({
      categoryBreakdown: Object.values(categoryStats),
      taxSummary,
      outstandingReport,
      totalInvoiced: invoices.reduce((s, i) => s + i.roundedGrandTotal, 0),
      totalCollected: invoices.reduce((s, i) => s + i.totalPaid, 0),
      totalOutstanding: invoices.reduce((s, i) => s + i.balanceDue, 0)
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 });
  }
}
