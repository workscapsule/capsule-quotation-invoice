import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateFinancials } from '@/lib/calculations';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        items: {
          orderBy: { sortOrder: 'asc' }
        },
        additionalCharges: true,
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const companySettings = await prisma.companySettings.findUnique({ where: { id: 'default' } });

    return NextResponse.json({ ...invoice, companySettings });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const {
      customerId = existing.customerId,
      projectId = existing.projectId,
      invoiceDate,
      dueDate,
      taxMode = existing.taxMode,
      discountType = existing.discountType,
      discountValue = existing.discountValue,
      gstRate = existing.gstRate,
      items = [],
      additionalCharges = [],
      notes,
      termsAndConditions
    } = body;

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    const totalPaid = existing.payments.reduce((sum, p) => sum + p.amountPaid, 0);

    const calculated = calculateFinancials({
      items,
      additionalCharges,
      discountType,
      discountValue,
      taxMode,
      gstRate,
      totalPaid,
      dueDate: dueDate || existing.dueDate
    });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.additionalCharge.deleteMany({ where: { invoiceId: id } });

      return tx.invoice.update({
        where: { id },
        data: {
          customerId,
          projectId,
          projectLocation: project?.location || customer?.address,
          customerPhone: customer?.phone,
          customerEmail: customer?.email,
          customerAddress: customer?.address,
          customerGstin: customer?.gstin,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : existing.invoiceDate,
          dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
          taxMode,
          discountType,
          discountValue: Number(discountValue) || 0,
          gstRate: Number(gstRate) || 18,
          subtotal: calculated.subtotal,
          discountAmount: calculated.discountAmount,
          taxableAmount: calculated.taxableAmount,
          cgstAmount: calculated.cgstAmount,
          sgstAmount: calculated.sgstAmount,
          igstAmount: calculated.igstAmount,
          otherChargesAmount: calculated.otherChargesAmount,
          grandTotal: calculated.grandTotal,
          roundedGrandTotal: calculated.roundedGrandTotal,
          totalPaid,
          balanceDue: calculated.balanceDue,
          paymentStatus: calculated.paymentStatus,
          notes: notes !== undefined ? notes : existing.notes,
          termsAndConditions: termsAndConditions !== undefined ? termsAndConditions : existing.termsAndConditions,
          updatedBy: session.name,
          items: {
            create: calculated.items.map((it, idx) => ({
              categoryId: it.categoryId || null,
              categoryName: it.categoryName || 'General',
              type: it.type || '',
              description: it.description || '',
              quantity: it.quantity,
              unit: it.unit || 'Nos',
              rate: it.rate,
              amount: it.amount,
              sortOrder: idx + 1
            }))
          },
          additionalCharges: {
            create: (additionalCharges || []).map((ch: any) => ({
              description: ch.description,
              amount: Number(ch.amount) || 0
            }))
          }
        },
        include: {
          customer: true,
          project: true,
          items: true,
          additionalCharges: true,
          payments: true
        }
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin permission required to delete invoices' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (existing && existing.payments.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete invoice that has recorded payments. Please delete associated payments first.'
      }, { status: 400 });
    }

    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
