import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';
import { numberToWordsINR } from './numberToWords';

export interface PDFGeneratorOptions {
  data: any;
  type: 'QUOTATION' | 'INVOICE';
  logoBase64?: string;
}

export function buildPDFDoc({ data, type, logoBase64 }: PDFGeneratorOptions): jsPDF {
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
  // Large bold tracked title on Left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(22, 22, 22);
  const titleText = isQuotation ? 'QUOTATION' : 'INVOICE';
  doc.text(titleText, margin, margin + 9, { charSpace: 2 });

  // Company branding & contact below title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 55, 55);
  doc.text('CAPSULE COMPANY  •  YOUR SPACE MAKER', margin, margin + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(95, 95, 95);
  const addressLines = doc.splitTextToSize(company.address, 115);
  doc.text(addressLines, margin, margin + 19);

  const contactY = margin + 19 + addressLines.length * 3.1;
  doc.text(`Phone: ${company.phone}  |  Email: ${company.email}  |  GSTIN: ${company.gstin || '29ABCDE1234F1Z5'}`, margin, contactY);

  // Circular Logo on Top Right
  const logoSize = 27;
  const logoX = pageWidth - margin - logoSize;
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

  // Header separator line
  const dividerY = Math.max(contactY + 4, logoY + logoSize + 2);
  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, dividerY, pageWidth - margin, dividerY);

  // --- 2. PARTIES & METADATA SECTION ---
  const metaStartY = dividerY + 4.5;

  // Left Column: ISSUED TO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(25, 25, 25);
  doc.text('ISSUED TO:', margin, metaStartY, { charSpace: 1 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 15, 15);
  doc.text(data.customer?.name || 'Valued Client', margin, metaStartY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  const projName = data.project?.name || 'Interior Work';
  const projLoc = data.projectLocation || data.project?.location || 'Bengaluru';
  doc.text(`Project: ${projName} (${projLoc})`, margin, metaStartY + 8.5);

  const custAddr = data.customerAddress || data.customer?.address || 'Site Address';
  const custAddrLines = doc.splitTextToSize(custAddr, 82);
  doc.text(custAddrLines.slice(0, 2), margin, metaStartY + 12.2);

  const custContactY = metaStartY + 12.2 + Math.min(custAddrLines.length, 2) * 3.2;
  const custPhone = data.customerPhone || data.customer?.phone || '-';
  const custEmail = data.customerEmail || data.customer?.email || '';
  const custGstin = data.customerGstin ? `  |  GSTIN: ${data.customerGstin}` : '';
  doc.text(`Phone: ${custPhone}${custEmail ? `  |  Email: ${custEmail}` : ''}${custGstin}`, margin, custContactY);

  // Right Column: DOCUMENT METADATA
  const rightMetaX = pageWidth - margin - 58;
  const drawMetaRow = (label: string, value: string, yPos: number, isAccent = false) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 90);
    doc.text(label, rightMetaX, yPos, { charSpace: 0.5 });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (isAccent) doc.setTextColor(179, 115, 86);
    else doc.setTextColor(20, 20, 20);
    doc.text(value, pageWidth - margin, yPos, { align: 'right' });
  };

  let rY = metaStartY + 0.5;
  if (isQuotation) {
    drawMetaRow('QUOTATION NO:', data.quotationNumber || 'CAP-QTN-0001', rY);
    rY += 4.2;
    drawMetaRow('DATE:', formatDate(data.quotationDate), rY);
    rY += 4.2;
    drawMetaRow('VALID UNTIL:', formatDate(data.validUntil), rY);
    rY += 4.2;
    drawMetaRow('TAX REGIME:', data.taxMode === 'IGST' ? 'Inter-state IGST' : 'CGST + SGST (18%)', rY);
  } else {
    drawMetaRow('INVOICE NO:', data.invoiceNumber || 'CAP-INV-0001', rY);
    rY += 4.2;
    drawMetaRow('INVOICE DATE:', formatDate(data.invoiceDate), rY);
    rY += 4.2;
    drawMetaRow('DUE DATE:', formatDate(data.dueDate), rY);
    rY += 4.2;
    const invStatus = data.status || 'ISSUED';
    drawMetaRow('STATUS:', invStatus, rY, true);
    if (data.quotation?.quotationNumber) {
      rY += 4.2;
      drawMetaRow('REF QUOTE:', data.quotation.quotationNumber, rY);
    }
  }

  // --- 3. WORK ITEMS TABLE ---
  const tableStartY = Math.max(custContactY + 4, rY + 4);

  const items = Array.isArray(data.items) ? data.items : [];
  const tableRows = items.map((item: any) => {
    const scopeHeader = `${item.categoryName ? `${item.categoryName}` : ''}${item.type ? ` — ${item.type}` : ''}`;
    const desc = item.description ? `\n${item.description}` : '';
    return [
      scopeHeader + desc,
      formatCurrency(item.rate ?? 0),
      `${item.quantity ?? 1} ${item.unit || 'Nos'}`,
      formatCurrency(item.amount ?? 0)
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [['DESCRIPTION', 'RATE', 'QTY', 'TOTAL']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 1, right: 1 },
    },
    bodyStyles: {
      textColor: [40, 40, 40],
      fontSize: 7.2,
      cellPadding: { top: 2.8, bottom: 2.8, left: 1, right: 1 },
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 26, halign: 'right' },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [20, 20, 20] },
    },
    margin: { left: margin, right: margin },
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
  doc.text(`IFSC: ${company.ifscCode || 'HDFC0001245'}  |  UPI: ${company.upiId || 'capsulecompany@hdfcbank'}`, margin, paymentY);
  paymentY += 4.5;

  // Amount in words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(50, 50, 50);
  doc.text('AMOUNT IN WORDS:', margin, paymentY);
  paymentY += 3.2;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(85, 85, 85);
  const words = numberToWordsINR(grandTotal);
  const wordLines = doc.splitTextToSize(words, contentWidth - totalsWidth - 10);
  doc.text(wordLines, margin, paymentY);
  paymentY += wordLines.length * 3.2 + 2;

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

export async function generateAndDownloadPDF({ data, type, logoBase64 }: PDFGeneratorOptions): Promise<void> {
  const isQuotation = type === 'QUOTATION';
  const doc = buildPDFDoc({ data, type, logoBase64 });
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
