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

async function getItemImagesBase64(items: any[]): Promise<(string | null)[]> {
  return Promise.all(
    (items || []).map(async (item) => {
      try {
        const rawUrl = item.imageUrl || resolveProductImage(item.categoryName, item.type, item.description);
        if (!rawUrl) return null;
        if (rawUrl.startsWith('data:image/')) return rawUrl;

        const cleanUrl = rawUrl.split('?')[0].split('#')[0];
        if (cleanUrl.startsWith('/') || !cleanUrl.startsWith('http')) {
          const cleanPath = cleanUrl.replace(/^\/+/, '');
          const filePath = path.join(process.cwd(), 'public', cleanPath);
          if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath);
            const ext = path.extname(filePath).slice(1).toLowerCase() || 'jpeg';
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : `image/${ext}`;
            return `data:${mime};base64,${fileData.toString('base64')}`;
          }
        } else if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
          const res = await fetch(cleanUrl);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = res.headers.get('content-type') || 'image/jpeg';
            return `data:${contentType};base64,${buffer.toString('base64')}`;
          }
        }
      } catch (e) {
        console.warn('Failed to read item image on server:', e);
      }
      return null;
    })
  );
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
      upiId: companySettings?.upiId || 'poornesh43-3@oksbi',
      name: companySettings?.accountName || 'Mr. Poornesh Bakila Babu',
      note: `${quotation.quotationNumber}`
    });

    const itemImagesBase64 = await getItemImagesBase64(quotation.items);

    const doc = buildPDFDoc({
      data: { ...quotation, companySettings },
      type: 'QUOTATION',
      logoBase64: getLogoBase64(),
      itemImagesBase64,
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
