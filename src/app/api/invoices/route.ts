import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateFinancials } from '@/lib/calculations';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const projectId = searchParams.get('projectId');

    const whereClause: any = {};
    if (status && status !== 'ALL') whereClause.paymentStatus = status;
    if (customerId) whereClause.customerId = customerId;
    if (projectId) whereClause.projectId = projectId;

    if (query) {
      whereClause.OR = [
        { invoiceNumber: { contains: query } },
        { customer: { name: { contains: query } } },
        { project: { name: { contains: query } } },
        { customerPhone: { contains: query } }
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, customerId: true, name: true, phone: true, email: true } },
        project: { select: { id: true, projectId: true, name: true, location: true } },
        items: true,
        payments: {
          select: { id: true, paymentId: true, amountPaid: true, paymentDate: true, paymentMethod: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

function parseSafeDate(val: any, fallback: Date): Date {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const sessionUser = session?.name || 'Capsule Office';

    const body = await req.json();
    const {
      customerId,
      projectId,
      invoiceDate,
      dueDate,
      taxMode = 'CGST_SGST',
      discountType = 'NONE',
      discountValue = 0,
      gstRate = 18,
      items = [],
      additionalCharges = [],
      notes,
      termsAndConditions
    } = body;

    let resolvedCustomerId = body.customerId;
    let resolvedProjectId = body.projectId;

    // Support dynamic on-the-fly customer creation or update if user typed customer name
    const rawCustomerName = (body.customerName || '').trim();
    if (rawCustomerName) {
      const cName = rawCustomerName;
      const cPhone = body.customerPhone?.trim() || '';

      let customer = resolvedCustomerId
        ? await prisma.customer.findUnique({ where: { id: resolvedCustomerId } })
        : await prisma.customer.findFirst({
            where: {
              OR: [
                { name: { equals: cName } },
                ...(cPhone ? [{ phone: { equals: cPhone } }] : [])
              ]
            }
          });

      if (!customer) {
        const count = await prisma.customer.count();
        let nextNum = count + 1;
        let cId = `CUST-${String(nextNum).padStart(3, '0')}`;
        while (await prisma.customer.findUnique({ where: { customerId: cId } })) {
          nextNum++;
          cId = `CUST-${String(nextNum).padStart(3, '0')}`;
        }

        customer = await prisma.customer.create({
          data: {
            customerId: cId,
            name: cName,
            phone: cPhone || '+91 00000 00000',
            altPhone: body.customerAltPhone?.trim() || null,
            email: body.customerEmail?.trim() || null,
            address: body.customerAddress?.trim() || null,
            city: body.customerCity?.trim() || 'Bengaluru',
            state: body.customerState?.trim() || 'Karnataka',
            pincode: body.customerPincode?.trim() || null,
            gstin: body.customerGstin?.trim() || null
          }
        });
      } else {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: cName,
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
      }
      resolvedCustomerId = customer.id;
    }

    if (!resolvedCustomerId) {
      // Default customer fallback
      const count = await prisma.customer.count();
      const cId = `CUST-${String(count + 1).padStart(3, '0')}`;
      const defaultCustomer = await prisma.customer.create({
        data: {
          customerId: cId,
          name: rawCustomerName || 'Valued Customer',
          phone: body.customerPhone?.trim() || '+91 00000 00000',
          address: body.customerAddress?.trim() || null,
          city: 'Bengaluru',
          state: 'Karnataka'
        }
      });
      resolvedCustomerId = defaultCustomer.id;
    }

    // Support dynamic on-the-fly project creation
    const rawProjectName = (body.projectName || '').trim();
    if (rawProjectName) {
      const pName = rawProjectName;
      let project = resolvedProjectId
        ? await prisma.project.findUnique({ where: { id: resolvedProjectId } })
        : await prisma.project.findFirst({
            where: {
              customerId: resolvedCustomerId,
              name: { equals: pName }
            }
          });

      if (!project) {
        const countP = await prisma.project.count();
        let nextNumP = countP + 1;
        let pId = `PRJ-${String(nextNumP).padStart(3, '0')}`;
        while (await prisma.project.findUnique({ where: { projectId: pId } })) {
          nextNumP++;
          pId = `PRJ-${String(nextNumP).padStart(3, '0')}`;
        }

        project = await prisma.project.create({
          data: {
            projectId: pId,
            customerId: resolvedCustomerId,
            name: pName,
            location: body.projectLocation?.trim() || body.customerAddress?.trim() || null,
            projectType: body.projectType?.trim() || 'Residential',
            status: 'NEW'
          }
        });
      } else if (body.projectLocation) {
        project = await prisma.project.update({
          where: { id: project.id },
          data: { location: body.projectLocation.trim() }
        });
      }
      resolvedProjectId = project.id;
    }

    if (!resolvedProjectId) {
      const customerForProj = await prisma.customer.findUnique({ where: { id: resolvedCustomerId } });
      const defaultPName = `${customerForProj?.name || 'Client'} Project`;
      const countP = await prisma.project.count();
      let nextNumP = countP + 1;
      let pId = `PRJ-${String(nextNumP).padStart(3, '0')}`;
      while (await prisma.project.findUnique({ where: { projectId: pId } })) {
        nextNumP++;
        pId = `PRJ-${String(nextNumP).padStart(3, '0')}`;
      }
      const newProject = await prisma.project.create({
        data: {
          projectId: pId,
          customerId: resolvedCustomerId,
          name: defaultPName,
          location: body.projectLocation?.trim() || customerForProj?.address || 'Bengaluru',
          projectType: 'Residential',
          status: 'NEW'
        }
      });
      resolvedProjectId = newProject.id;
    }

    const sanitizedItems = (!items || items.length === 0)
      ? [{ categoryName: 'General', type: 'Design & Work', description: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }]
      : items;

    const customer = await prisma.customer.findUnique({ where: { id: resolvedCustomerId } });
    const project = await prisma.project.findUnique({ where: { id: resolvedProjectId } });

    if (!customer || !project) {
      return NextResponse.json({ error: 'Selected Customer or Project could not be resolved' }, { status: 404 });
    }

    const calculated = calculateFinancials({
      items: sanitizedItems,
      additionalCharges,
      discountType,
      discountValue: Number(discountValue) || 0,
      taxMode,
      gstRate: Number(gstRate) || 18,
      totalPaid: 0,
      dueDate
    });

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

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: parseSafeDate(invoiceDate, new Date()),
        dueDate: parseSafeDate(dueDate, new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)),
        customerId: resolvedCustomerId,
        projectId: resolvedProjectId,
        projectLocation: body.projectLocation?.trim() || project.location || customer.address || null,
        customerPhone: body.customerPhone?.trim() || customer.phone || null,
        customerEmail: body.customerEmail?.trim() || customer.email || null,
        customerAddress: body.customerAddress?.trim() || customer.address || null,
        customerGstin: body.customerGstin?.trim() || customer.gstin || null,
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
        totalPaid: 0,
        balanceDue: calculated.roundedGrandTotal,
        paymentStatus: calculated.paymentStatus,
        notes: notes || null,
        termsAndConditions: termsAndConditions || companySettings?.defaultTerms,
        createdBy: sessionUser,
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
        additionalCharges: true
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create invoice' }, { status: 500 });
  }
}
