import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';
import { numberToWordsINR } from './numberToWords';
import { resolveProductImage, getBase64ImageFromUrl } from './productImages';
import { generateUpiQrDataUrl } from './upiQr';

export interface PDFGeneratorOptions {
  data: any;
  type: 'QUOTATION' | 'INVOICE';
  logoBase64?: string;
  itemImagesBase64?: (string | null)[];
  upiQrBase64?: string;
}

export function buildPDFDoc({ data, type, logoBase64, itemImagesBase64, upiQrBase64 }: PDFGeneratorOptions): jsPDF {
  const isQuotation = type === 'QUOTATION';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const company = data.companySettings || {
    companyName: 'Capsule Company',
    tagline: 'YOUR SPACE MAKER',
    address: 'N.173, 1st & 2nd Flr, SLV Complex, Hebbal Kempapura, Amruthahalli, Outer Ring Road, Kariyanna Layout, Bengaluru (Urban), Karnataka – 560024',
    phone: '+91 96321 24422',
    email: 'Workscapsule@gmail.com',
    website: '',
    gstin: '29ABCDE1234F1Z5',
    bankName: 'HDFC Bank',
    accountName: 'CAPSULE COMPANY',
    accountNumber: '50200034981276',
    ifscCode: 'HDFC0001245',
    branch: 'Indiranagar Branch, Bengaluru',
    upiId: 'capsulecompany@hdfcbank',
    authorizedSignatory: 'For CAPSULE COMPANY (Authorized Signatory)',
  };

  // --- 1. TOP HEADER (MODERN EDITORIAL DESIGN) ---
  // Circular Logo on Left
  const logoSize = 26;
  const logoX = margin;
  const logoY = margin;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (e) {
      console.warn('Logo base64 embed failed:', e);
    }
  } else if (typeof document !== 'undefined') {
    try {
      const img = document.querySelector('img[alt="Capsule Logo"]') as HTMLImageElement;
      if (img && img.complete && img.naturalWidth > 0) {
        doc.addImage(img, 'PNG', logoX, logoY, logoSize, logoSize);
      }
    } catch (e) {
      console.warn('Logo DOM embed failed:', e);
    }
  }

  // Mention below logo on Left:
  const logoCenterX = logoX + logoSize / 2;
  const brandNameY = logoY + logoSize + 3.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(25, 25, 25);
  doc.text(company.companyName || 'Capsule Company', logoCenterX, brandNameY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(110, 110, 110);
  doc.text(company.tagline || 'Your Space Maker', logoCenterX, brandNameY + 3.2, { align: 'center' });

  // Large bold tracked title on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(22, 22, 22);
  const titleText = isQuotation ? 'QUOTATION' : 'INVOICE';
  doc.text(titleText, pageWidth - margin, margin + 7.5, { align: 'right', charSpace: 1.5 });

  // Company Name on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(25, 25, 25);
  doc.text((company.companyName || 'CAPSULE COMPANY').toUpperCase(), pageWidth - margin, margin + 12.2, { align: 'right' });

  // Company address below company name on Right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(95, 95, 95);
  const addressLines = doc.splitTextToSize(company.address, 95);
  let addrY = margin + 16;
  for (let i = 0; i < addressLines.length; i++) {
    doc.text(addressLines[i], pageWidth - margin, addrY, { align: 'right' });
    addrY += 3.1;
  }

  const contactY = addrY + 0.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text(`Phone: ${company.phone}  |  Email: ${company.email}`, pageWidth - margin, contactY, { align: 'right' });
  let finalHeaderRightY = contactY;
  if (company.gstin) {
    finalHeaderRightY += 3.2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`GSTIN: ${company.gstin}`, pageWidth - margin, finalHeaderRightY, { align: 'right' });
  }

  // Header separator line
  const leftHeaderBottomY = brandNameY + 5;
  const dividerY = Math.max(finalHeaderRightY + 4, leftHeaderBottomY);
  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, dividerY, pageWidth - margin, dividerY);

  // --- 2. PARTIES & METADATA SECTION ---
  const metaStartY = dividerY + 3.5;
  const colWidth = contentWidth / 4;

  // Metadata strip with light fill
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, metaStartY, contentWidth, 9.5, 1, 1, 'FD');

  const drawMetaCol = (colIndex: number, label: string, value: string, isMono = false) => {
    const colX = margin + colIndex * colWidth + 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(110, 110, 110);
    doc.text(label, colX, metaStartY + 3.5, { charSpace: 0.3 });

    doc.setFont('helvetica', isMono ? 'bold' : 'normal');
    doc.setFontSize(7);
    doc.setTextColor(25, 25, 25);
    doc.text(value, colX, metaStartY + 7.5);
  };

  if (isQuotation) {
    drawMetaCol(0, 'QUOTATION NO:', data.quotationNumber || 'CAP-QTN-0001', true);
    drawMetaCol(1, 'DATE:', formatDate(data.quotationDate));
    drawMetaCol(2, 'VALID UNTIL:', formatDate(data.validUntil));
    drawMetaCol(3, 'TAX REGIME:', data.taxMode === 'IGST' ? 'Inter-state IGST' : 'CGST + SGST (18%)');
  } else {
    drawMetaCol(0, 'INVOICE NO:', data.invoiceNumber || 'CAP-INV-0001', true);
    drawMetaCol(1, 'INVOICE DATE:', formatDate(data.invoiceDate));
    drawMetaCol(2, 'DUE DATE:', formatDate(data.dueDate));
    const invStatus = data.status || 'ISSUED';
    drawMetaCol(3, 'STATUS:', invStatus, true);
  }

  // Two-column Box: BILL TO / CUSTOMER DETAILS & PROJECT & SITE LOCATION
  const boxY = metaStartY + 12;
  const dividerX = margin + contentWidth / 2;
  const colHalfWidth = contentWidth / 2 - 7;

  const custName = data.customer?.name || 'Valued Client';
  const custAddr = data.customerAddress || data.customer?.address || 'Site Address';
  const custAddrLines = doc.splitTextToSize(custAddr, colHalfWidth).slice(0, 2);
  const custPhone = data.customerPhone || data.customer?.phone || '-';
  const custEmail = data.customerEmail || data.customer?.email || '';
  const custGstin = data.customerGstin;

  const projName = data.project?.name || 'Interior Work';
  const projLoc = data.projectLocation || data.project?.location || 'Bengaluru';
  const projType = data.project?.projectType || 'Residential';
  const projId = data.project?.projectId || (data.project?.id ? `PRJ-${data.project.id.slice(-4).toUpperCase()}` : 'PRJ-001');

  // Compute box height
  let leftLineCount = 2 + custAddrLines.length + 1 + (custEmail ? 1 : 0) + (custGstin ? 1 : 0);
  const boxHeight = Math.max(26, 12 + leftLineCount * 3.1);

  // Outer container border
  doc.setDrawColor(215, 215, 215);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, boxY, contentWidth, boxHeight, 1.5, 1.5, 'S');

  // Vertical divider between columns
  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.2);
  doc.line(dividerX, boxY + 2.5, dividerX, boxY + boxHeight - 2.5);

  // --- Left Column: BILL TO / CUSTOMER DETAILS ---
  const leftX = margin + 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(110, 105, 100);
  doc.text('BILL TO / CUSTOMER DETAILS', leftX, boxY + 4.2, { charSpace: 0.4 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 15, 15);
  doc.text(custName, leftX, boxY + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(80, 80, 80);
  let curLeftY = boxY + 12.2;
  for (let i = 0; i < custAddrLines.length; i++) {
    doc.text(custAddrLines[i], leftX, curLeftY);
    curLeftY += 3.2;
  }
  doc.text(`Phone: ${custPhone}`, leftX, curLeftY);
  curLeftY += 3.2;
  if (custEmail) {
    doc.text(`Email: ${custEmail}`, leftX, curLeftY);
    curLeftY += 3.2;
  }
  if (custGstin) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${custGstin}`, leftX, curLeftY);
  }

  // --- Right Column: PROJECT & SITE LOCATION ---
  const rightX = dividerX + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(110, 105, 100);
  doc.text('PROJECT & SITE LOCATION', rightX, boxY + 4.2, { charSpace: 0.4 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 15, 15);
  doc.text(projName, rightX, boxY + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Site Location: ${projLoc}`, rightX, boxY + 12.2);
  doc.text(`Type: ${projType}`, rightX, boxY + 15.4);
  doc.text(`Project ID: ${projId}`, rightX, boxY + 18.6);

  // --- 3. WORK ITEMS TABLE ---
  const tableStartY = boxY + boxHeight + 3.5;

  const items = Array.isArray(data.items) ? data.items : [];
  const tableRows = items.map((item: any) => {
    const scopeHeader = `${item.categoryName ? `${item.categoryName}` : ''}${item.type ? ` — ${item.type}` : ''}`;
    const desc = item.description ? `\n${item.description}` : '';
    return [
      '', // Column 0: Product Image (drawn in didDrawCell)
      scopeHeader + desc,
      `${item.quantity ?? 1}`,
      item.unit || 'Nos',
      formatCurrency(item.rate ?? 0),
      formatCurrency(item.amount ?? 0)
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [['IMAGE', 'TYPE & WORK SPECIFICATIONS', 'QTY', 'UNIT', 'RATE', 'TOTAL']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 7.2,
      cellPadding: { top: 3, bottom: 3, left: 1, right: 1 },
    },
    bodyStyles: {
      textColor: [40, 40, 40],
      fontSize: 7.2,
      cellPadding: { top: 2.5, bottom: 2.5, left: 1, right: 1 },
      valign: 'middle',
      minCellHeight: 16.5, // ensures consistent height for product image
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' }, // Product Image column
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' }, // QTY
      3: { cellWidth: 15, halign: 'center' }, // UNIT (between QTY and RATE)
      4: { cellWidth: 25, halign: 'right' },  // RATE
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [20, 20, 20] }, // TOTAL
    },
    margin: { left: margin, right: margin },
    didDrawCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 0) {
        const rowIndex = hookData.row.index;
        const imgData = itemImagesBase64?.[rowIndex];
        if (imgData) {
          try {
            const imgWidth = 18; // mm
            const imgHeight = 13.5; // mm (4:3 aspect ratio)
            const cellX = hookData.cell.x + (hookData.cell.width - imgWidth) / 2;
            const cellY = hookData.cell.y + (hookData.cell.height - imgHeight) / 2;
            doc.addImage(imgData, 'JPEG', cellX, cellY, imgWidth, imgHeight);

            // Subtle border around image
            doc.setDrawColor(215, 215, 215);
            doc.setLineWidth(0.18);
            doc.rect(cellX, cellY, imgWidth, imgHeight);
          } catch (e) {
            console.warn('Failed to embed product image in PDF table:', e);
          }
        }
      }
    }
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || tableStartY + 20;

  // Clean lines mirroring reference image
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.5);
  doc.line(margin, tableStartY, pageWidth - margin, tableStartY); // Top table line

  const headerBottomY = tableStartY + 8.5;
  doc.setLineWidth(0.2);
  doc.setDrawColor(210, 210, 210);
  doc.line(margin, headerBottomY, pageWidth - margin, headerBottomY); // Below headers line

  doc.setLineWidth(0.5);
  doc.setDrawColor(30, 30, 30);
  doc.line(margin, finalTableY, pageWidth - margin, finalTableY); // Table bottom line

  let currentY = finalTableY + 3.5;

  // Check if totals section will overflow the page
  const remainingSpace = pageHeight - currentY - margin;
  if (remainingSpace < 55) {
    doc.addPage();
    currentY = margin + 5;
  }

  // --- 4. TOTALS SECTION (Right) & PAYMENT INFO (Left) ---
  const totalsWidth = 65;
  const totalsX = pageWidth - margin - totalsWidth;
  let totalsY = currentY + 1;

  const drawTotalLine = (label: string, value: string, isBold = false, isLarge = false, isAccent = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isLarge ? 9.5 : 7.2);
    if (isAccent) doc.setTextColor(179, 115, 86);
    else if (isLarge) doc.setTextColor(15, 15, 15);
    else doc.setTextColor(70, 70, 70);

    doc.text(label, totalsX, totalsY);
    doc.text(value, pageWidth - margin, totalsY, { align: 'right' });
    totalsY += isLarge ? 5.2 : 3.8;
  };

  const subtotal = data.subtotal ?? 0;
  const discountAmount = data.discountAmount ?? 0;
  const cgstAmount = data.cgstAmount ?? 0;
  const sgstAmount = data.sgstAmount ?? 0;
  const igstAmount = data.igstAmount ?? 0;
  const otherChargesAmount = data.otherChargesAmount ?? 0;
  const grandTotal = data.roundedGrandTotal ?? data.grandTotal ?? 0;

  drawTotalLine('SUBTOTAL', formatCurrency(subtotal), true);

  if (discountAmount > 0) {
    drawTotalLine(`Discount (${data.discountValue ?? 0}%):`, `- ${formatCurrency(discountAmount)}`);
  }

  if (cgstAmount > 0 || sgstAmount > 0) {
    const half = (data.gstRate || 18) / 2;
    drawTotalLine(`CGST (${half}%):`, formatCurrency(cgstAmount));
    drawTotalLine(`SGST (${half}%):`, formatCurrency(sgstAmount));
  } else if (igstAmount > 0) {
    drawTotalLine(`IGST (${data.gstRate || 18}%):`, formatCurrency(igstAmount));
  }

  if (otherChargesAmount > 0) {
    drawTotalLine('Other Charges:', formatCurrency(otherChargesAmount));
  }

  // Thin line above total
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.2);
  doc.line(totalsX, totalsY - 0.8, pageWidth - margin, totalsY - 0.8);
  totalsY += 1.8;

  drawTotalLine('TOTAL', formatCurrency(grandTotal), true, true);

  // For Invoices: Paid & Balance Due
  if (!isQuotation) {
    const totalPaid = data.totalPaid ?? 0;
    const balanceDue = data.balanceDue ?? grandTotal - totalPaid;
    drawTotalLine('Total Paid:', formatCurrency(totalPaid));
    drawTotalLine('Balance Due:', formatCurrency(balanceDue), true, false, true);
  }

  // Left Column: PAYMENT INFO & AMOUNT IN WORDS
  let paymentY = currentY + 1;
  const paymentStartTopY = paymentY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(25, 25, 25);
  doc.text('PAYMENT INFO:', margin, paymentY, { charSpace: 1 });
  paymentY += 3.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(75, 75, 75);
  doc.text(`Bank: ${company.bankName || 'HDFC Bank'}`, margin, paymentY);
  paymentY += 3.4;
  doc.text(`Account Name: ${company.accountName || 'CAPSULE COMPANY'}`, margin, paymentY);
  paymentY += 3.4;
  doc.text(`Account No.: ${company.accountNumber || '50200034981276'}`, margin, paymentY);
  paymentY += 3.4;
  doc.text(`IFSC: ${company.ifscCode || 'HDFC0001245'}`, margin, paymentY);
  paymentY += 3.4;
  doc.text(`UPI ID: ${company.upiId || 'capsulecompany@hdfcbank'}`, margin, paymentY);
  paymentY += 4.5;

  const wordsBoxWidth = contentWidth - totalsWidth - 10;

  // Render UPI QR Code if available
  if (upiQrBase64) {
    try {
      const qrSize = 16.5; // mm
      const qrBoxWidth = qrSize + 4.5;
      const qrBoxHeight = qrSize + 7.5;
      const qrBoxX = margin + wordsBoxWidth - qrBoxWidth;
      const qrBoxY = paymentStartTopY + 0.5;

      // QR container box
      doc.setDrawColor(215, 215, 215);
      doc.setLineWidth(0.2);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight, 1, 1, 'FD');

      // QR Image
      doc.addImage(upiQrBase64, 'PNG', qrBoxX + 2.25, qrBoxY + 1.8, qrSize, qrSize);

      // Labels below QR
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(50, 50, 50);
      doc.text('SCAN TO PAY', qrBoxX + qrBoxWidth / 2, qrBoxY + qrSize + 3.8, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.2);
      doc.setTextColor(110, 110, 110);
      doc.text('UPI / GPay / PhonePe', qrBoxX + qrBoxWidth / 2, qrBoxY + qrSize + 6, { align: 'center' });
    } catch (e) {
      console.warn('Failed to embed UPI QR code in PDF:', e);
    }
  }

  // Amount in words (with styled box outline)
  const words = numberToWordsINR(grandTotal);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  const wordLines = doc.splitTextToSize(words, wordsBoxWidth - 6);
  const wordsBoxHeight = 4 + 3.2 + wordLines.length * 3.2 + 2;

  // Draw box outline with rounded corners and light fill
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.25);
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(margin, paymentY, wordsBoxWidth, wordsBoxHeight, 1.5, 1.5, 'FD');

  // Title inside box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(40, 40, 40);
  doc.text('AMOUNT IN WORDS:', margin + 3, paymentY + 3.8);

  // Content inside box
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(70, 70, 70);
  doc.text(wordLines, margin + 3, paymentY + 7.2);

  paymentY += wordsBoxHeight + 2;

  // --- 5. TERMS & SIGNATURE SECTION ---
  const sectionDividerY = Math.max(totalsY, paymentY) + 3;
  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, sectionDividerY, pageWidth - margin, sectionDividerY);

  const footerY = sectionDividerY + 3.5;

  // Terms and conditions on Bottom Left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(30, 30, 30);
  doc.text('TERMS & CONDITIONS:', margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(110, 110, 110);
  const termsText = data.termsAndConditions || company.defaultTerms || (isQuotation
    ? '1. 50% advance on approval, 40% on material delivery at site, 10% on handover.\n2. Quotation valid for 30 days from date of issue.'
    : '1. Payment due as per agreed schedule. Late payments may attract interest.\n2. All goods delivered remain property until paid in full.');
  const termsLines = doc.splitTextToSize(termsText, contentWidth - 55);
  doc.text(termsLines.slice(0, 3), margin, footerY + 3.2);

  // Signature on Bottom Right
  const sigX = pageWidth - margin - 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(20, 20, 20);
  doc.text('For CAPSULE COMPANY', sigX, footerY + 1.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  doc.text('Authorized Signatory', sigX, footerY + 8);

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(sigX, footerY + 10, pageWidth - margin, footerY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(130, 130, 130);
  doc.text('(Authorized Signatory)', sigX + 6, footerY + 13);

  return doc;
}

export async function generateAndDownloadPDF({ data, type, logoBase64, upiQrBase64 }: PDFGeneratorOptions): Promise<void> {
  const isQuotation = type === 'QUOTATION';
  const items = Array.isArray(data.items) ? data.items : [];

  // Pre-fetch and convert item images to base64 for PDF embedding
  const itemImagesBase64 = await Promise.all(
    items.map(async (item: any) => {
      const url = item.imageUrl || resolveProductImage(item.categoryName, item.type, item.description);
      return getBase64ImageFromUrl(url);
    })
  );

  const company = data.companySettings || {};
  const upiId = company.upiId || 'capsulecompany@hdfcbank';
  const amount = isQuotation ? undefined : (data.balanceDue ?? data.roundedGrandTotal);
  const docNumber = isQuotation ? data.quotationNumber : data.invoiceNumber;
  const finalUpiQr = upiQrBase64 || await generateUpiQrDataUrl({
    upiId,
    name: company.accountName || company.companyName || 'CAPSULE COMPANY',
    amount,
    note: `${docNumber}`
  });

  const doc = buildPDFDoc({ data, type, logoBase64, itemImagesBase64, upiQrBase64: finalUpiQr });
  const filename = `${isQuotation ? (data.quotationNumber || 'QUOTATION') : (data.invoiceNumber || 'INVOICE')}.pdf`;

  if (typeof window !== 'undefined') {
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    link.style.position = 'fixed';
    link.style.left = '-9999px';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 4000);
  } else {
    doc.save(filename);
  }
}
