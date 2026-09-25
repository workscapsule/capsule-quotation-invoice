import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const query = searchParams.get('q')?.trim() || '';

    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;
    if (status && status !== 'ALL') whereClause.status = status;
    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { projectId: { contains: query } },
        { location: { contains: query } },
        { customer: { name: { contains: query } } }
      ];
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, customerId: true, name: true, phone: true, email: true }
        },
        quotations: {
          select: { id: true, quotationNumber: true, roundedGrandTotal: true, status: true }
        },
        invoices: {
          select: { id: true, invoiceNumber: true, roundedGrandTotal: true, totalPaid: true, balanceDue: true, paymentStatus: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = projects.map(p => {
      const totalQuotationValue = p.quotations.reduce((sum, q) => sum + q.roundedGrandTotal, 0);
      const approvedQuotationValue = p.quotations.filter(q => q.status === 'APPROVED' || q.status === 'CONVERTED').reduce((sum, q) => sum + q.roundedGrandTotal, 0);
      const totalInvoiceValue = p.invoices.reduce((sum, inv) => sum + inv.roundedGrandTotal, 0);
      const totalPaid = p.invoices.reduce((sum, inv) => sum + inv.totalPaid, 0);
      const totalOutstanding = p.invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

      return {
        id: p.id,
        projectId: p.projectId,
        customerId: p.customerId,
        customer: p.customer,
        name: p.name,
        location: p.location,
        projectType: p.projectType,
        startDate: p.startDate,
        expectedCompletionDate: p.expectedCompletionDate,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt,
        quotationsCount: p.quotations.length,
        invoicesCount: p.invoices.length,
        totalQuotationValue,
        approvedQuotationValue,
        totalInvoiceValue,
        totalPaid,
        totalOutstanding
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    let customerId = data.customerId;
    const name = data.name?.trim();

    if (!customerId && data.customerName?.trim()) {
      const cName = data.customerName.trim();
      let customer = await prisma.customer.findFirst({
        where: { name: { equals: cName } }
      });
      if (!customer) {
        const countC = await prisma.customer.count();
        const cId = `CUST-${String(countC + 1).padStart(3, '0')}`;
        customer = await prisma.customer.create({
          data: {
            customerId: cId,
            name: cName,
            phone: data.customerPhone?.trim() || '+91 00000 00000',
            address: data.location?.trim() || null
          }
        });
      }
      customerId = customer.id;
    }

    if (!customerId || !name) {
      return NextResponse.json({ error: 'Customer Name and Project Name are required' }, { status: 400 });
    }

    // Auto-generate projectId: PRJ-001, PRJ-002, etc.
    const count = await prisma.project.count();
    let nextNum = count + 1;
    let projectId = `PRJ-${String(nextNum).padStart(3, '0')}`;

    let exists = await prisma.project.findUnique({ where: { projectId } });
    while (exists) {
      nextNum++;
      projectId = `PRJ-${String(nextNum).padStart(3, '0')}`;
      exists = await prisma.project.findUnique({ where: { projectId } });
    }

    const project = await prisma.project.create({
      data: {
        projectId,
        customerId,
        name,
        location: data.location?.trim() || null,
        projectType: data.projectType?.trim() || 'Residential',
        startDate: data.startDate ? new Date(data.startDate) : null,
        expectedCompletionDate: data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : null,
        status: data.status || 'NEW',
        notes: data.notes?.trim() || null
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
