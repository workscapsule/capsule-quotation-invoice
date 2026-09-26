import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
        additionalCharges: true,
        customer: true,
        project: true
      }
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Generate New Invoice Number: CAP-INV-0001
    const companySettings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    const prefix = companySettings?.invoicePrefix || 'CAP-INV-';

    const count = await prisma.invoice.count();
    let nextNum = count + 1;
    let invoiceNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;

    let exists = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    while (exists) {
      nextNum++;
      invoiceNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;
      exists = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    }

    const invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : new Date();
    const dueDate = body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days default

    // Create Invoice & update Quotation in transaction
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          quotationId: quotation.id,
          invoiceDate,
          dueDate,
          customerId: quotation.customerId,
          projectId: quotation.projectId,
          projectLocation: quotation.projectLocation,
          customerPhone: quotation.customerPhone,
          customerEmail: quotation.customerEmail,
          customerAddress: quotation.customerAddress,
          customerGstin: quotation.customerGstin,
          taxMode: quotation.taxMode,
          discountType: quotation.discountType,
          discountValue: quotation.discountValue,
          gstRate: quotation.gstRate,
          subtotal: quotation.subtotal,
          discountAmount: quotation.discountAmount,
          taxableAmount: quotation.taxableAmount,
          cgstAmount: quotation.cgstAmount,
          sgstAmount: quotation.sgstAmount,
          igstAmount: quotation.igstAmount,
          otherChargesAmount: quotation.otherChargesAmount,
          grandTotal: quotation.grandTotal,
          roundedGrandTotal: quotation.roundedGrandTotal,
          totalPaid: 0,
          balanceDue: quotation.roundedGrandTotal,
          paymentStatus: 'UNPAID',
          notes: quotation.notes,
          termsAndConditions: quotation.termsAndConditions,
          createdBy: session.name,
          updatedBy: session.name,
          items: {
            create: quotation.items.map((it) => ({
              categoryId: it.categoryId,
              categoryName: it.categoryName,
              imageUrl: it.imageUrl,
              type: it.type,
              description: it.description,
              quantity: it.quantity,
              unit: it.unit,
              rate: it.rate,
              amount: it.amount,
              sortOrder: it.sortOrder
            }))
          },
          additionalCharges: {
            create: quotation.additionalCharges.map((ch) => ({
              description: ch.description,
              amount: ch.amount
            }))
          }
        },
        include: {
          items: true,
          customer: true,
          project: true
        }
      });

      // Update source quotation status to CONVERTED
      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: 'CONVERTED',
          convertedInvoiceId: invoice.id,
          updatedBy: session.name
        }
      });

      return invoice;
    });

    return NextResponse.json({
      success: true,
      message: 'Quotation converted to Invoice successfully',
      invoice: result
    }, { status: 201 });
  } catch (error) {
    console.error('Error converting quotation to invoice:', error);
    return NextResponse.json({ error: 'Failed to convert quotation to invoice' }, { status: 500 });
  }
}
