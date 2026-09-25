import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPDFDoc } from '@/lib/pdfGenerator';
import fs from 'fs';
import path from 'path';

let cachedLogoBase64: string | undefined;

function getLogoBase64(): string | undefined {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'capsule-logo.png');
    if (fs.existsSync(logoPath)) {
      const fileData = fs.readFileSync(logoPath);
      cachedLogoBase64 = `data:image/png;base64,${fileData.toString('base64')}`;
      return cachedLogoBase64;
    }
  } catch (e) {
    console.warn('Failed to read logo file on server:', e);
  }
  return undefined;
}

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

    const doc = buildPDFDoc({
      data: { ...quotation, companySettings },
      type: 'QUOTATION',
      logoBase64: getLogoBase64()
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = `${quotation.quotationNumber || 'QUOTATION'}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
