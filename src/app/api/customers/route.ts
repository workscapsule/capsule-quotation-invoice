import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    const whereClause: any = {};
    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { customerId: { contains: query } },
        { phone: { contains: query } },
        { email: { contains: query } },
        { city: { contains: query } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        projects: {
          select: { id: true, name: true, status: true, location: true }
        },
        invoices: {
          select: { roundedGrandTotal: true, totalPaid: true, balanceDue: true, paymentStatus: true }
        },
        quotations: {
          select: { id: true, quotationNumber: true, status: true, roundedGrandTotal: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = customers.map(c => {
      const totalInvoiceValue = c.invoices.reduce((sum, inv) => sum + inv.roundedGrandTotal, 0);
      const totalPaid = c.invoices.reduce((sum, inv) => sum + inv.totalPaid, 0);
      const outstandingBalance = c.invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

      return {
        id: c.id,
        customerId: c.customerId,
        name: c.name,
        phone: c.phone,
        altPhone: c.altPhone,
        email: c.email,
        address: c.address,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        gstin: c.gstin,
        notes: c.notes,
        createdAt: c.createdAt,
        projectCount: c.projects.length,
        projects: c.projects,
        quotationCount: c.quotations.length,
        invoiceCount: c.invoices.length,
        totalInvoiceValue,
        totalPaid,
        outstandingBalance
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const name = data.name?.trim();
    const phone = data.phone?.trim();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Customer Name and Phone are required' }, { status: 400 });
    }

    // Auto-generate customerId sequentially: CUST-001, CUST-002, etc.
    const count = await prisma.customer.count();
    let nextNum = count + 1;
    let customerId = `CUST-${String(nextNum).padStart(3, '0')}`;

    // Ensure uniqueness
    let exists = await prisma.customer.findUnique({ where: { customerId } });
    while (exists) {
      nextNum++;
      customerId = `CUST-${String(nextNum).padStart(3, '0')}`;
      exists = await prisma.customer.findUnique({ where: { customerId } });
    }

    const customer = await prisma.customer.create({
      data: {
        customerId,
        name,
        phone,
        altPhone: data.altPhone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || 'Karnataka',
        pincode: data.pincode?.trim() || null,
        gstin: data.gstin?.trim() || null,
        notes: data.notes?.trim() || null
      }
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
