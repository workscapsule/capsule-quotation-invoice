import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    let settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: { id: 'default' }
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin permission required to update company settings' }, { status: 403 });
    }

    const data = await req.json();

    const updated = await prisma.companySettings.upsert({
      where: { id: 'default' },
      update: {
        companyName: data.companyName,
        tagline: data.tagline,
        logoUrl: data.logoUrl,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        gstin: data.gstin,
        bankName: data.bankName,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        branch: data.branch,
        upiId: data.upiId,
        quotationPrefix: data.quotationPrefix,
        invoicePrefix: data.invoicePrefix,
        defaultTerms: data.defaultTerms,
        authorizedSignatory: data.authorizedSignatory
      },
      create: {
        id: 'default',
        companyName: data.companyName || 'CAPSULE COMPANY',
        tagline: data.tagline || 'YOUR SPACE MAKER',
        logoUrl: data.logoUrl || '/capsule-logo.png',
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        gstin: data.gstin,
        bankName: data.bankName,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        branch: data.branch,
        upiId: data.upiId,
        quotationPrefix: data.quotationPrefix || 'CAP-QTN-',
        invoicePrefix: data.invoicePrefix || 'CAP-INV-',
        defaultTerms: data.defaultTerms,
        authorizedSignatory: data.authorizedSignatory || 'For CAPSULE COMPANY'
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
