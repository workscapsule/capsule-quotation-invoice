import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId');
    const customerId = searchParams.get('customerId');
    const paymentMethod = searchParams.get('method');

    const whereClause: any = {};
    if (invoiceId) whereClause.invoiceId = invoiceId;
    if (customerId) whereClause.customerId = customerId;
    if (paymentMethod && paymentMethod !== 'ALL') whereClause.paymentMethod = paymentMethod;

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, customerId: true, name: true, phone: true } },
        project: { select: { id: true, projectId: true, name: true } },
        invoice: { select: { id: true, invoiceNumber: true, roundedGrandTotal: true, totalPaid: true, balanceDue: true } }
      },
      orderBy: { paymentDate: 'desc' }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      invoiceId,
      amountPaid,
      paymentMethod = 'BANK_TRANSFER',
      paymentDate,
      referenceNumber,
      notes
    } = body;

    const numAmount = Number(amountPaid);
    if (!invoiceId || isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Valid Invoice ID and positive Amount Paid are required' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Auto-generate paymentId: PAY-0001, PAY-0002...
    const count = await prisma.payment.count();
    let nextNum = count + 1;
    let paymentId = `PAY-${String(nextNum).padStart(4, '0')}`;

    let exists = await prisma.payment.findUnique({ where: { paymentId } });
    while (exists) {
      nextNum++;
      paymentId = `PAY-${String(nextNum).padStart(4, '0')}`;
      exists = await prisma.payment.findUnique({ where: { paymentId } });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentId,
          invoiceId,
          customerId: invoice.customerId,
          projectId: invoice.projectId,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amountPaid: numAmount,
          paymentMethod,
          referenceNumber: referenceNumber?.trim() || null,
          notes: notes?.trim() || null,
          recordedBy: session.name
        }
      });

      // Recalculate invoice totals and paymentStatus
      const allPayments = await tx.payment.findMany({ where: { invoiceId } });
      const newTotalPaid = allPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const newBalanceDue = Math.max(0, invoice.roundedGrandTotal - newTotalPaid);

      const isOverdue = invoice.dueDate.getTime() < new Date().setHours(0,0,0,0);
      let newStatus: string = 'UNPAID';
      if (newTotalPaid >= invoice.roundedGrandTotal && invoice.roundedGrandTotal > 0) {
        newStatus = 'PAID';
      } else if (newTotalPaid > 0 && newTotalPaid < invoice.roundedGrandTotal) {
        newStatus = isOverdue ? 'OVERDUE' : 'PARTIALLY_PAID';
      } else if (newTotalPaid === 0) {
        newStatus = isOverdue && invoice.roundedGrandTotal > 0 ? 'OVERDUE' : 'UNPAID';
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          totalPaid: newTotalPaid,
          balanceDue: newBalanceDue,
          paymentStatus: newStatus
        }
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
