import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id }
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        description: data.description?.trim() ?? null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { id } = await params;

    // Check if category is used in quotation items or invoice items
    const quoteItemCount = await prisma.quotationItem.count({ where: { categoryId: id } });
    const invoiceItemCount = await prisma.invoiceItem.count({ where: { categoryId: id } });

    if (quoteItemCount > 0 || invoiceItemCount > 0) {
      // Instead of hard deleting, deactivate to preserve data integrity
      await prisma.category.update({
        where: { id },
        data: { isActive: false }
      });
      return NextResponse.json({
        message: 'Category is referenced in existing quotations/invoices. It has been deactivated instead of deleted.'
      });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
