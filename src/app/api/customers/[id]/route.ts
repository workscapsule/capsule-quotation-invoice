import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            quotations: {
              select: { id: true, quotationNumber: true, grandTotal: true, status: true, quotationDate: true }
            },
            invoices: {
              select: { id: true, invoiceNumber: true, grandTotal: true, totalPaid: true, balanceDue: true, paymentStatus: true, invoiceDate: true }
            },
            payments: {
              select: { id: true, paymentId: true, amountPaid: true, paymentDate: true, paymentMethod: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        quotations: {
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const totalQuotationValue = customer.quotations.reduce((sum, q) => sum + q.roundedGrandTotal, 0);
    const totalInvoiceValue = customer.invoices.reduce((sum, inv) => sum + inv.roundedGrandTotal, 0);
    const totalPaid = customer.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const outstandingBalance = Math.max(0, totalInvoiceValue - totalPaid);

    return NextResponse.json({
      ...customer,
      totalQuotationValue,
      totalInvoiceValue,
      totalPaid,
      outstandingBalance
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json({ error: 'Failed to fetch customer profile' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        phone: data.phone?.trim(),
        altPhone: data.altPhone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        pincode: data.pincode?.trim() || null,
        gstin: data.gstin?.trim() || null,
        notes: data.notes?.trim() || null
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin permission required to delete customers' }, { status: 403 });
    }

    const { id } = await params;

    // Check if customer has invoices or quotations
    const invoiceCount = await prisma.invoice.count({ where: { customerId: id } });
    if (invoiceCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete customer with existing invoices. Financial records must be preserved.'
      }, { status: 400 });
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
