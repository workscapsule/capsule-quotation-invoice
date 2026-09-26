import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPDFDoc } from '@/lib/pdfGenerator';
import { resolveProductImage } from '@/lib/productImages';
import { generateUpiQrDataUrl } from '@/lib/upiQr';
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

function getItemImagesBase64(items: any[]): (string | null)[] {
  return (items || []).map((item) => {
    try {
      const imgUrl = item.imageUrl || resolveProductImage(item.categoryName, item.type, item.description);
      if (imgUrl.startsWith('/')) {
        const cleanPath = imgUrl.startsWith('/') ? imgUrl.slice(1) : imgUrl;
        const filePath = path.join(process.cwd(), 'public', cleanPath);
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath);
          const ext = path.extname(filePath).slice(1) || 'jpeg';
          return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${fileData.toString('base64')}`;
        }
      } else if (imgUrl.startsWith('data:image/')) {
        return imgUrl;
      }
    } catch (e) {
      console.warn('Failed to read item image on server:', e);
    }
    return null;
  });
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

    const upiQrBase64 = await generateUpiQrDataUrl({
      upiId: companySettings?.upiId || 'capsulecompany@hdfcbank',
      name: companySettings?.accountName || companySettings?.companyName || 'CAPSULE COMPANY',
      note: `${quotation.quotationNumber}`
    });

    const doc = buildPDFDoc({
      data: { ...quotation, companySettings },
      type: 'QUOTATION',
      logoBase64: getLogoBase64(),
      itemImagesBase64: getItemImagesBase64(quotation.items),
      upiQrBase64
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
