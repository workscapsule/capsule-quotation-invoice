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

function parseSafeDate(val: any, fallback: Date): Date {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const sessionUser = session?.name || 'Capsule Office';

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    let customerId = body.customerId || existing.customerId;
    let projectId = body.projectId || existing.projectId;

    // Update customer details if customerName provided
    const rawCustomerName = (body.customerName || '').trim();
    if (rawCustomerName) {
      const cPhone = body.customerPhone?.trim() || '';
      let customer = customerId
        ? await prisma.customer.findUnique({ where: { id: customerId } })
        : null;

      if (!customer) {
        customer = await prisma.customer.findFirst({
          where: {
            OR: [
              { name: { equals: rawCustomerName } },
              ...(cPhone ? [{ phone: { equals: cPhone } }] : [])
            ]
          }
        });
      }

      if (customer) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: rawCustomerName,
            ...(cPhone ? { phone: cPhone } : {}),
            ...(body.customerAltPhone !== undefined ? { altPhone: body.customerAltPhone.trim() || null } : {}),
            ...(body.customerEmail !== undefined ? { email: body.customerEmail.trim() || null } : {}),
            ...(body.customerAddress !== undefined ? { address: body.customerAddress.trim() || null } : {}),
            ...(body.customerCity !== undefined ? { city: body.customerCity.trim() || 'Bengaluru' } : {}),
            ...(body.customerState !== undefined ? { state: body.customerState.trim() || 'Karnataka' } : {}),
            ...(body.customerPincode !== undefined ? { pincode: body.customerPincode.trim() || null } : {}),
            ...(body.customerGstin !== undefined ? { gstin: body.customerGstin.trim() || null } : {})
          }
        });
        customerId = customer.id;
      }
    }

    // Update project details if projectName provided
    const rawProjectName = (body.projectName || '').trim();
    if (rawProjectName && projectId) {
      const existingProj = await prisma.project.findUnique({ where: { id: projectId } });
      if (existingProj) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            name: rawProjectName,
            ...(body.projectLocation ? { location: body.projectLocation.trim() } : {})
          }
        });
      }
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    const {
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

    const totalPaid = existing.payments.reduce((sum, p) => sum + p.amountPaid, 0);

    const sanitizedItems = (!items || items.length === 0)
      ? [{ categoryName: 'General', type: 'Design & Work', description: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }]
      : items;

    const calculated = calculateFinancials({
      items: sanitizedItems,
      additionalCharges,
      discountType,
      discountValue: Number(discountValue) || 0,
      taxMode,
      gstRate: Number(gstRate) || 18,
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
          projectLocation: body.projectLocation?.trim() || project?.location || customer?.address || null,
          customerPhone: body.customerPhone?.trim() || customer?.phone || null,
          customerEmail: body.customerEmail?.trim() || customer?.email || null,
          customerAddress: body.customerAddress?.trim() || customer?.address || null,
          customerGstin: body.customerGstin?.trim() || customer?.gstin || null,
          invoiceDate: parseSafeDate(invoiceDate, existing.invoiceDate),
          dueDate: parseSafeDate(dueDate, existing.dueDate),
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
          updatedBy: sessionUser,
          items: {
            create: calculated.items.map((it, idx) => ({
              categoryId: it.categoryId || null,
              categoryName: (it.categoryName || 'General').trim(),
              type: (it.type || '').trim(),
              description: (it.description || '').trim(),
              quantity: isNaN(Number(it.quantity)) || Number(it.quantity) <= 0 ? 1 : Number(it.quantity),
              unit: (it.unit || 'Nos').trim(),
              rate: isNaN(Number(it.rate)) ? 0 : Number(it.rate),
              amount: isNaN(Number(it.amount)) ? 0 : Number(it.amount),
              sortOrder: idx + 1
            }))
          },
          additionalCharges: {
            create: (additionalCharges || [])
              .filter((ch: any) => ch && (ch.description || ch.amount))
              .map((ch: any) => ({
                description: String(ch.description || 'Additional Charge').trim(),
                amount: isNaN(Number(ch.amount)) ? 0 : Number(ch.amount)
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
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update invoice' }, { status: 500 });
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
