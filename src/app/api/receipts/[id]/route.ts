import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { numberToWordsINR } from '@/lib/numberToWords';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const receipt = await prisma.paymentReceipt.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        quotation: true,
        invoice: true
      }
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Payment receipt not found' }, { status: 404 });
    }

    const companySettings = await prisma.companySettings.findUnique({ where: { id: 'default' } });

    return NextResponse.json({ ...receipt, companySettings });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.paymentReceipt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Payment receipt not found' }, { status: 404 });
    }

    const {
      receiptDate,
      customerId,
      projectId,
      quotationId,
      invoiceId,
      quotationNumber,
      invoiceNumber,
      customerName,
      customerPhone,
      customerAddress,
      projectName,
      projectLocation,
      amountReceived,
      paymentDate,
      paymentMode,
      transactionId,
      paymentPurpose,
      remarks,
      totalProjectAmount,
      previousPaymentsReceived = 0,
      receivedBy,
      authorizedSignatory,
      status,
      allowNegative = false
    } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: 'Customer Name is required' }, { status: 400 });
    }
    if (!customerPhone || !customerPhone.trim()) {
      return NextResponse.json({ error: 'Customer Contact Number is required' }, { status: 400 });
    }
    if (!projectName || !projectName.trim()) {
      return NextResponse.json({ error: 'Project Name is required' }, { status: 400 });
    }

    const numAmount = Number(amountReceived);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Amount Received must be greater than zero' }, { status: 400 });
    }

    const numTotalProject = Number(totalProjectAmount);
    if (isNaN(numTotalProject) || numTotalProject < 0) {
      return NextResponse.json({ error: 'Total Project Amount must be a valid non-negative number' }, { status: 400 });
    }

    const numPrevPaid = Number(previousPaymentsReceived) || 0;
    const currentPaymentReceived = numAmount;
    const totalPaymentsReceived = Number((numPrevPaid + currentPaymentReceived).toFixed(2));
    const remainingBalance = Number((numTotalProject - totalPaymentsReceived).toFixed(2));

    if (remainingBalance < 0 && !allowNegative) {
      return NextResponse.json({
        error: `Remaining balance cannot be negative (₹${remainingBalance}). Total payments received (₹${totalPaymentsReceived}) exceed total project amount (₹${numTotalProject}). Please review amounts.`
      }, { status: 400 });
    }

    const amountInWords = numberToWordsINR(currentPaymentReceived);

    const updated = await prisma.paymentReceipt.update({
      where: { id },
      data: {
        receiptDate: receiptDate ? new Date(receiptDate) : existing.receiptDate,
        customerId: customerId !== undefined ? customerId : existing.customerId,
        projectId: projectId !== undefined ? projectId : existing.projectId,
        quotationId: quotationId !== undefined ? quotationId : existing.quotationId,
        invoiceId: invoiceId !== undefined ? invoiceId : existing.invoiceId,
        quotationNumber: quotationNumber !== undefined ? quotationNumber : existing.quotationNumber,
        invoiceNumber: invoiceNumber !== undefined ? invoiceNumber : existing.invoiceNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress !== undefined ? (customerAddress?.trim() || null) : existing.customerAddress,
        projectName: projectName.trim(),
        projectLocation: projectLocation !== undefined ? (projectLocation?.trim() || null) : existing.projectLocation,
        amountReceived: currentPaymentReceived,
        amountInWords,
        paymentDate: paymentDate ? new Date(paymentDate) : existing.paymentDate,
        paymentMode: paymentMode || existing.paymentMode,
        transactionId: transactionId !== undefined ? (transactionId?.trim() || null) : existing.transactionId,
        paymentPurpose: paymentPurpose || existing.paymentPurpose,
        remarks: remarks !== undefined ? (remarks?.trim() || null) : existing.remarks,
        totalProjectAmount: numTotalProject,
        previousPaymentsReceived: numPrevPaid,
        currentPaymentReceived,
        totalPaymentsReceived,
        remainingBalance,
        receivedBy: receivedBy || existing.receivedBy,
        authorizedSignatory: authorizedSignatory || existing.authorizedSignatory,
        status: status || existing.status
      },
      include: {
        customer: true,
        project: true,
        quotation: true,
        invoice: true
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating receipt:', error);
    return NextResponse.json({ error: error.message || 'Failed to update receipt' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.paymentReceipt.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Receipt deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete receipt' }, { status: 500 });
  }
}
