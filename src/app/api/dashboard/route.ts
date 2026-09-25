import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalCustomers = await prisma.customer.count();
    const totalProjects = await prisma.project.count();

    const quotations = await prisma.quotation.findMany({
      select: {
        id: true,
        quotationNumber: true,
        status: true,
        roundedGrandTotal: true,
        quotationDate: true,
        customer: { select: { name: true } },
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        paymentStatus: true,
        roundedGrandTotal: true,
        totalPaid: true,
        balanceDue: true,
        invoiceDate: true,
        customer: { select: { name: true } },
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        paymentId: true,
        amountPaid: true,
        paymentDate: true,
        paymentMethod: true,
        customer: { select: { name: true } },
        invoice: { select: { invoiceNumber: true } }
      },
      orderBy: { paymentDate: 'desc' },
      take: 6
    });

    // Quotation metrics
    const totalQuotations = quotations.length;
    const pendingQuotations = quotations.filter(q => q.status === 'PENDING' || q.status === 'SENT' || q.status === 'DRAFT').length;
    const approvedQuotations = quotations.filter(q => q.status === 'APPROVED' || q.status === 'CONVERTED').length;
    const rejectedQuotations = quotations.filter(q => q.status === 'REJECTED' || q.status === 'EXPIRED').length;
    const totalQuotationValue = quotations.reduce((sum, q) => sum + q.roundedGrandTotal, 0);

    // Invoice metrics
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(i => i.paymentStatus === 'PAID').length;
    const partiallyPaidInvoices = invoices.filter(i => i.paymentStatus === 'PARTIALLY_PAID').length;
    const unpaidInvoices = invoices.filter(i => i.paymentStatus === 'UNPAID').length;
    const overdueInvoices = invoices.filter(i => i.paymentStatus === 'OVERDUE').length;

    const totalInvoiceValue = invoices.reduce((sum, i) => sum + i.roundedGrandTotal, 0);
    const totalAmountReceived = invoices.reduce((sum, i) => sum + i.totalPaid, 0);
    const totalOutstandingAmount = invoices.reduce((sum, i) => sum + i.balanceDue, 0);

    return NextResponse.json({
      metrics: {
        totalCustomers,
        totalProjects,
        totalQuotations,
        pendingQuotations,
        approvedQuotations,
        rejectedQuotations,
        totalInvoices,
        paidInvoices,
        partiallyPaidInvoices,
        unpaidInvoices,
        overdueInvoices,
        totalQuotationValue,
        totalInvoiceValue,
        totalAmountReceived,
        totalOutstandingAmount
      },
      recentQuotations: quotations.slice(0, 5),
      recentInvoices: invoices.slice(0, 5),
      recentPayments: payments
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
