import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        quotations: {
          include: {
            items: true
          },
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          include: {
            items: true,
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const totalQuotationValue = project.quotations.reduce((sum, q) => sum + q.roundedGrandTotal, 0);
    const approvedQuotationValue = project.quotations
      .filter(q => q.status === 'APPROVED' || q.status === 'CONVERTED')
      .reduce((sum, q) => sum + q.roundedGrandTotal, 0);
    const totalInvoiceValue = project.invoices.reduce((sum, inv) => sum + inv.roundedGrandTotal, 0);
    const totalPaid = project.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalOutstanding = Math.max(0, totalInvoiceValue - totalPaid);

    // Extract unique categories used in this project
    const categorySet = new Set<string>();
    project.quotations.forEach(q => q.items.forEach(it => categorySet.add(it.categoryName)));
    project.invoices.forEach(inv => inv.items.forEach(it => categorySet.add(it.categoryName)));

    return NextResponse.json({
      ...project,
      totalQuotationValue,
      approvedQuotationValue,
      totalInvoiceValue,
      totalPaid,
      totalOutstanding,
      categoriesUsed: Array.from(categorySet)
    });
  } catch (error) {
    console.error('Error fetching project detail:', error);
    return NextResponse.json({ error: 'Failed to fetch project detail' }, { status: 500 });
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

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        location: data.location?.trim() || null,
        projectType: data.projectType?.trim() || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        expectedCompletionDate: data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : null,
        status: data.status,
        notes: data.notes?.trim() || null
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { id } = await params;

    const invoiceCount = await prisma.invoice.count({ where: { projectId: id } });
    if (invoiceCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete project with existing invoices. Financial records must be preserved.'
      }, { status: 400 });
    }

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
