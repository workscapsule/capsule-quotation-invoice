import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateFinancials } from '@/lib/calculations';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        items: {
          orderBy: { sortOrder: 'asc' }
        },
        additionalCharges: true
      }
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const companySettings = await prisma.companySettings.findUnique({ where: { id: 'default' } });

    return NextResponse.json({ ...quotation, companySettings });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
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

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const {
      customerId = existing.customerId,
      projectId = existing.projectId,
      quotationDate,
      validUntil,
      taxMode = existing.taxMode,
      discountType = existing.discountType,
      discountValue = existing.discountValue,
      gstRate = existing.gstRate,
      items = [],
      additionalCharges = [],
      notes,
      termsAndConditions,
      status = existing.status
    } = body;

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    const calculated = calculateFinancials({
      items,
      additionalCharges,
      discountType,
      discountValue,
      taxMode,
      gstRate
    });

    // Replace items and additional charges in transaction
    const updated = await prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      await tx.additionalCharge.deleteMany({ where: { quotationId: id } });

      return tx.quotation.update({
        where: { id },
        data: {
          customerId,
          projectId,
          projectLocation: project?.location || customer?.address,
          customerPhone: customer?.phone,
          customerEmail: customer?.email,
          customerAddress: customer?.address,
          customerGstin: customer?.gstin,
          quotationDate: quotationDate ? new Date(quotationDate) : existing.quotationDate,
          validUntil: validUntil ? new Date(validUntil) : existing.validUntil,
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
          status,
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
          additionalCharges: true
        }
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Check if this is a "duplicate" action
    if (body.action === 'duplicate') {
      const source = await prisma.quotation.findUnique({
        where: { id },
        include: { items: true, additionalCharges: true }
      });

      if (!source) {
        return NextResponse.json({ error: 'Source quotation not found' }, { status: 404 });
      }

      const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
      const prefix = settings?.quotationPrefix || 'CAP-QTN-';
      const count = await prisma.quotation.count();
      let nextNum = count + 1;
      let quotationNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;

      let exists = await prisma.quotation.findUnique({ where: { quotationNumber } });
      while (exists) {
        nextNum++;
        quotationNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;
        exists = await prisma.quotation.findUnique({ where: { quotationNumber } });
      }

      const duplicated = await prisma.quotation.create({
        data: {
          quotationNumber,
          quotationDate: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          customerId: source.customerId,
          projectId: source.projectId,
          projectLocation: source.projectLocation,
          customerPhone: source.customerPhone,
          customerEmail: source.customerEmail,
          customerAddress: source.customerAddress,
          customerGstin: source.customerGstin,
          taxMode: source.taxMode,
          discountType: source.discountType,
          discountValue: source.discountValue,
          gstRate: source.gstRate,
          subtotal: source.subtotal,
          discountAmount: source.discountAmount,
          taxableAmount: source.taxableAmount,
          cgstAmount: source.cgstAmount,
          sgstAmount: source.sgstAmount,
          igstAmount: source.igstAmount,
          otherChargesAmount: source.otherChargesAmount,
          grandTotal: source.grandTotal,
          roundedGrandTotal: source.roundedGrandTotal,
          status: 'DRAFT', // duplicated starts as Draft
          notes: source.notes,
          termsAndConditions: source.termsAndConditions,
          createdBy: session.name,
          updatedBy: session.name,
          items: {
            create: source.items.map(it => ({
              categoryId: it.categoryId,
              categoryName: it.categoryName,
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
            create: source.additionalCharges.map(ch => ({
              description: ch.description,
              amount: ch.amount
            }))
          }
        },
        include: {
          customer: true,
          project: true,
          items: true
        }
      });

      return NextResponse.json({ success: true, quotation: duplicated });
    }

    // Otherwise, normal status update
    if (body.status) {
      const updated = await prisma.quotation.update({
        where: { id },
        data: {
          status: body.status,
          updatedBy: session.name
        }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'No valid action or status provided' }, { status: 400 });
  } catch (error) {
    console.error('Error modifying quotation:', error);
    return NextResponse.json({ error: 'Failed to modify quotation' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin permission required to delete quotations' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.quotation.findUnique({ where: { id } });

    if (existing?.status === 'CONVERTED') {
      return NextResponse.json({
        error: 'Cannot delete a quotation that has already been converted to an invoice.'
      }, { status: 400 });
    }

    await prisma.quotation.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 });
  }
}
