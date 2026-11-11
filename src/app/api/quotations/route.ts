import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateFinancials } from '@/lib/calculations';
import { DEFAULT_QUOTATION_TERMS } from '@/lib/terms';
import { getNextQuotationNumber, getNextCustomerId, getNextProjectId } from '@/lib/numbering';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const projectId = searchParams.get('projectId');

    const whereClause: any = {};
    if (status && status !== 'ALL') whereClause.status = status;
    if (customerId) whereClause.customerId = customerId;
    if (projectId) whereClause.projectId = projectId;

    if (query) {
      whereClause.OR = [
        { quotationNumber: { contains: query } },
        { customer: { name: { contains: query } } },
        { project: { name: { contains: query } } },
        { customerPhone: { contains: query } }
      ];
    }

    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, customerId: true, name: true, phone: true, email: true } },
        project: { select: { id: true, projectId: true, name: true, location: true } },
        items: true,
        additionalCharges: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformed = quotations.map(q => ({
      ...q,
      pricingMode: q.discountType === 'QUANTITY' ? 'QUANTITY' : 'SQUARE_FEET'
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
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
      quotationDate,
      validUntil,
      taxMode = 'CGST_SGST',
      discountType = 'NONE',
      discountValue = 0,
      gstRate = 18,
      items = [],
      additionalCharges = [],
      notes,
      termsAndConditions,
      status = 'DRAFT'
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
        const cId = await getNextCustomerId();

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
      // Create a default customer so user is never blocked from saving
      const cId = await getNextCustomerId();
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
        const pId = await getNextProjectId();

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
      const pId = await getNextProjectId();
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
      ? [{ categoryName: 'General', type: 'Design & Work', description: '', sqFt: 0, quantity: 0, unit: 'Sq. Ft.', rate: 0, amount: 0 }]
      : items;

    // Verify Customer and Project
    const customer = await prisma.customer.findUnique({ where: { id: resolvedCustomerId } });
    const project = await prisma.project.findUnique({ where: { id: resolvedProjectId } });

    if (!customer || !project) {
      return NextResponse.json({ error: 'Selected Customer or Project could not be resolved' }, { status: 404 });
    }

    const pricingMode = body.pricingMode || (body.discountType === 'QUANTITY' ? 'QUANTITY' : 'SQUARE_FEET');

    // Run Calculation Engine (Discounts removed completely)
    const calculated = calculateFinancials({
      items: sanitizedItems,
      additionalCharges,
      pricingMode,
      taxMode,
      gstRate: Number(gstRate) || 18
    });

    // Auto-generate sequential Quotation Number using highest existing sequence to prevent any collisions
    const companySettings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    const prefix = companySettings?.quotationPrefix || 'CAP-QTN-';
    const quotationNumber = await getNextQuotationNumber(prefix);

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        quotationDate: parseSafeDate(quotationDate, new Date()),
        validUntil: parseSafeDate(validUntil, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        customerId: resolvedCustomerId,
        projectId: resolvedProjectId,
        projectLocation: body.projectLocation?.trim() || project.location || customer.address || null,
        customerPhone: body.customerPhone?.trim() || customer.phone || null,
        customerEmail: body.customerEmail?.trim() || customer.email || null,
        customerAddress: body.customerAddress?.trim() || customer.address || null,
        customerGstin: body.customerGstin?.trim() || customer.gstin || null,
        taxMode,
        discountType: pricingMode,
        discountValue: 0,
        gstRate: Number(gstRate) || 18,
        subtotal: calculated.subtotal,
        discountAmount: 0,
        taxableAmount: calculated.taxableAmount,
        cgstAmount: calculated.cgstAmount,
        sgstAmount: calculated.sgstAmount,
        igstAmount: calculated.igstAmount,
        otherChargesAmount: calculated.otherChargesAmount,
        grandTotal: calculated.grandTotal,
        roundedGrandTotal: calculated.roundedGrandTotal,
        status: status || 'DRAFT',
        notes: notes || null,
        termsAndConditions: termsAndConditions || (companySettings as any)?.defaultQuotationTerms || DEFAULT_QUOTATION_TERMS,
        createdBy: sessionUser,
        updatedBy: sessionUser,
        items: {
          create: calculated.items.map((it, idx) => ({
            categoryId: it.categoryId || null,
            categoryName: (it.categoryName || 'General').trim(),
            imageUrl: it.imageUrl || null,
            type: (it.type || '').trim(),
            description: (it.description || '').trim(),
            quantity: pricingMode === 'SQUARE_FEET'
              ? (isNaN(Number(it.sqFt ?? it.quantity)) ? 0 : Number(it.sqFt ?? it.quantity))
              : (isNaN(Number(it.quantity ?? it.sqFt)) ? 0 : Number(it.quantity ?? it.sqFt)),
            unit: pricingMode === 'SQUARE_FEET' ? 'Sq. Ft.' : (it.unit && it.unit !== 'Sq. Ft.' ? it.unit : 'Nos'),
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

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quotation:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create quotation' }, { status: 500 });
  }
}
