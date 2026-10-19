import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { numberToWordsINR } from '@/lib/numberToWords';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const mode = searchParams.get('mode') || '';

    const where: any = {};

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { receiptNumber: { contains: q } },
        { customerName: { contains: q } },
        { customerPhone: { contains: q } },
        { projectName: { contains: q } },
        { quotationNumber: { contains: q } },
        { invoiceNumber: { contains: q } },
        { transactionId: { contains: q } }
      ];
    }

    if (mode && mode !== 'ALL') {
      where.paymentMode = mode;
    }

    const receipts = await prisma.paymentReceipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        project: true,
        quotation: true,
        invoice: true
      }
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Failed to fetch payment receipts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      receiptNumber: customReceiptNumber,
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
      receivedBy = 'CAPSULE COMPANY',
      authorizedSignatory = 'For CAPSULE COMPANY (Authorized Signatory)',
      allowNegative = false
    } = body;

    // Validation
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
    if (!paymentMode) {
      return NextResponse.json({ error: 'Payment Mode is required' }, { status: 400 });
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

    // Determine unique receipt number
    let receiptNumber = customReceiptNumber?.trim();
    if (!receiptNumber) {
      const companySettings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
      const prefix = companySettings?.receiptPrefix || 'CAP-REC-';

      // Count existing receipts to generate sequential number
      const count = await prisma.paymentReceipt.count();
      let nextSeq = count + 1;
      let unique = false;
      while (!unique) {
        const candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
        const existing = await prisma.paymentReceipt.findUnique({ where: { receiptNumber: candidate } });
        if (!existing) {
          receiptNumber = candidate;
          unique = true;
        } else {
          nextSeq++;
        }
      }
    } else {
      // Validate provided receipt number uniqueness
      const existing = await prisma.paymentReceipt.findUnique({ where: { receiptNumber } });
      if (existing) {
        return NextResponse.json({ error: `Receipt Number ${receiptNumber} already exists. Please use a unique number.` }, { status: 400 });
      }
    }

    const amountInWords = numberToWordsINR(currentPaymentReceived);

    const receipt = await prisma.paymentReceipt.create({
      data: {
        receiptNumber,
        receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
        customerId: customerId || null,
        projectId: projectId || null,
        quotationId: quotationId || null,
        invoiceId: invoiceId || null,
        quotationNumber: quotationNumber || null,
        invoiceNumber: invoiceNumber || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress?.trim() || null,
        projectName: projectName.trim(),
        projectLocation: projectLocation?.trim() || null,
        amountReceived: currentPaymentReceived,
        amountInWords,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMode,
        transactionId: transactionId?.trim() || null,
        paymentPurpose: paymentPurpose || 'Part Payment',
        remarks: remarks?.trim() || null,
        totalProjectAmount: numTotalProject,
        previousPaymentsReceived: numPrevPaid,
        currentPaymentReceived,
        totalPaymentsReceived,
        remainingBalance,
        receivedBy: receivedBy || 'CAPSULE COMPANY',
        authorizedSignatory: authorizedSignatory || 'For CAPSULE COMPANY (Authorized Signatory)',
        status: 'ISSUED'
      },
      include: {
        customer: true,
        project: true,
        quotation: true,
        invoice: true
      }
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment receipt:', error);
    return NextResponse.json({ error: error.message || 'Failed to create payment receipt' }, { status: 500 });
  }
}
