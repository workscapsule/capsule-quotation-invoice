import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatPdfCurrency, formatDate, formatDateDDMMYYYY } from './formatters';
import { numberToWordsINR } from './numberToWords';
import { resolveProductImage, getBase64ImageFromUrl } from './productImages';
import { generateUpiQrDataUrl } from './upiQr';
import { DEFAULT_QUOTATION_TERMS, DEFAULT_INVOICE_TERMS } from './terms';

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
    phone: '9187924723, 9187924523, 9187924623',
    email: 'Workscapsule@gmail.com',
    website: '',
    gstin: '29ABCDE1234F1Z5',
    bankName: 'IDFC FIRST',
    accountName: 'Mr. Poornesh Bakila Babu',
    accountNumber: '10177698837',
    ifscCode: 'IDFB0081101',
    swiftCode: 'IDFBINBBMUM',
    branch: 'BANGALORE-BASAVESHWARA NAGAR BRANCH',
    upiId: 'poornesh43-3@oksbi',
    authorizedSignatory: 'Kishmat Sah Thakuri',
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
    drawMetaCol(3, 'TAX REGIME:', data.taxMode === 'IGST' ? 'Inter-state IGST' : 'CGST & SGST (18%)');
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
      formatPdfCurrency(item.rate ?? 0),
      formatPdfCurrency(item.amount ?? 0)
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
  if (remainingSpace < 65) {
    doc.addPage();
    currentY = margin + 5;
  }

  // --- 4. TOTALS SECTION (Right) & PAYMENT INFO (Left) ---
  const totalsWidth = 65;
  const totalsX = pageWidth - margin - totalsWidth;
  const totalsRightX = pageWidth - margin - 1;
  let totalsY = currentY + 1;

  const drawTotalLine = (label: string, value: string, isBold = false, isLarge = false, isAccent = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isLarge ? 9.0 : 7.2);
    if (isAccent) doc.setTextColor(179, 115, 86);
    else if (isLarge) doc.setTextColor(15, 15, 15);
    else doc.setTextColor(70, 70, 70);

    doc.text(label, totalsX, totalsY);
    doc.text(value, totalsRightX, totalsY, { align: 'right' });
    totalsY += isLarge ? 5.0 : 3.8;
  };

  const subtotal = data.subtotal ?? 0;
  const discountAmount = data.discountAmount ?? 0;
  const cgstAmount = data.cgstAmount ?? 0;
  const sgstAmount = data.sgstAmount ?? 0;
  const igstAmount = data.igstAmount ?? 0;
  const otherChargesAmount = data.otherChargesAmount ?? 0;
  const grandTotal = data.roundedGrandTotal ?? data.grandTotal ?? 0;

  drawTotalLine('SUBTOTAL', formatPdfCurrency(subtotal), true);

  if (discountAmount > 0) {
    drawTotalLine(`Discount (${data.discountValue ?? 0}%):`, `- ${formatPdfCurrency(discountAmount)}`);
  }

  if (cgstAmount > 0 || sgstAmount > 0) {
    const half = (data.gstRate || 18) / 2;
    drawTotalLine(`CGST (${half}%):`, formatPdfCurrency(cgstAmount));
    drawTotalLine(`SGST (${half}%):`, formatPdfCurrency(sgstAmount));
  } else if (igstAmount > 0) {
    drawTotalLine(`IGST (${data.gstRate || 18}%):`, formatPdfCurrency(igstAmount));
  }

  if (otherChargesAmount > 0) {
    drawTotalLine('Other Charges:', formatPdfCurrency(otherChargesAmount));
  }

  // Thin line above total
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.2);
  doc.line(totalsX, totalsY - 0.8, totalsRightX, totalsY - 0.8);
  totalsY += 1.8;

  drawTotalLine('TOTAL', formatPdfCurrency(grandTotal), true, true);

  // For Invoices: Paid & Balance Due
  if (!isQuotation) {
    const totalPaid = data.totalPaid ?? 0;
    const balanceDue = data.balanceDue ?? grandTotal - totalPaid;
    drawTotalLine('Total Paid:', formatPdfCurrency(totalPaid));
    drawTotalLine('Balance Due:', formatPdfCurrency(balanceDue), true, false, true);
  }

  // Left Column: PAYMENT INFO & AMOUNT IN WORDS
  const wordsBoxWidth = contentWidth - totalsWidth - 10;
  let paymentY = currentY + 1;
  const paymentStartTopY = paymentY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(25, 25, 25);
  doc.text('PAYMENT INFO:', margin, paymentY, { charSpace: 1 });
  paymentY += 3.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  doc.setTextColor(75, 75, 75);
  doc.text(`Bank: ${company.bankName || 'IDFC FIRST'}`, margin, paymentY);
  paymentY += 3.2;
  doc.text(`Account Name: ${company.accountName || 'Mr. Poornesh Bakila Babu'}`, margin, paymentY);
  paymentY += 3.2;
  doc.text(`Account No.: ${company.accountNumber || '10177698837'}`, margin, paymentY);
  paymentY += 3.2;
  doc.text(`IFSC: ${company.ifscCode || 'IDFB0081101'}`, margin, paymentY);
  paymentY += 3.2;
  if (company.swiftCode || !company.bankName) {
    doc.text(`SWIFT Code: ${company.swiftCode || 'IDFBINBBMUM'}`, margin, paymentY);
    paymentY += 3.2;
  }
  if (company.branch) {
    const maxBranchW = wordsBoxWidth - 25;
    const branchLines = doc.splitTextToSize(`Branch: ${company.branch}`, maxBranchW);
    doc.text(branchLines[0] || `Branch: ${company.branch}`, margin, paymentY);
    paymentY += 3.2;
  }
  doc.text(`UPI ID: ${company.upiId || 'poornesh43-3@oksbi'}`, margin, paymentY);
  paymentY += 4.2;

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
  let sectionDividerY = Math.max(totalsY, paymentY) + 3;

  const hasNotes = isQuotation && Boolean(data.notes && String(data.notes).trim());
  const termsWidth = contentWidth - 52;
  const lineSpacing = 2.65;

  let termsText = data.termsAndConditions;
  if (isQuotation) {
    if (!termsText || termsText.includes('commence design and procurement') || termsText.includes('commence procurement') || termsText.includes('advance on approval, 40% on material delivery')) {
      termsText = company.defaultQuotationTerms || DEFAULT_QUOTATION_TERMS;
    }
  } else {
    if (!termsText || termsText.includes('Quotation valid for') || termsText.includes('pipe installation') || termsText.includes('plumbing fittings') || termsText.includes('commence design and procurement')) {
      termsText = company.defaultInvoiceTerms || company.defaultTerms || DEFAULT_INVOICE_TERMS;
    }
  }

  const termsLines: string[] = doc.splitTextToSize(termsText, termsWidth);
  const notesLines: string[] = hasNotes ? doc.splitTextToSize(String(data.notes).trim(), termsWidth) : [];

  const neededFooterHeight = (hasNotes ? (3.5 + notesLines.length * lineSpacing + 3) : 0) + 3.5 + (termsLines.length * lineSpacing) + 12;

  if (sectionDividerY + neededFooterHeight > pageHeight - margin) {
    doc.addPage();
    sectionDividerY = margin + 5;
  }

  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, sectionDividerY, pageWidth - margin, sectionDividerY);

  const footerY = sectionDividerY + 3.5;
  let leftCurrY = footerY;

  // Project Specific Notes (Quotation Only)
  if (hasNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 30, 30);
    doc.text('PROJECT SPECIFIC NOTES:', margin, leftCurrY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(70, 70, 70);

    leftCurrY += 3.2;
    for (let i = 0; i < notesLines.length; i++) {
      if (leftCurrY + lineSpacing > pageHeight - margin) {
        doc.addPage();
        leftCurrY = margin + 5;
      }
      doc.text(notesLines[i], margin, leftCurrY);
      leftCurrY += lineSpacing;
    }
    leftCurrY += 2.8; // Spacing before terms
  }

  // Terms and conditions on Bottom Left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(30, 30, 30);
  doc.text('TERMS & CONDITIONS:', margin, leftCurrY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(95, 95, 95);

  leftCurrY += 3.2;
  for (let i = 0; i < termsLines.length; i++) {
    if (leftCurrY + lineSpacing > pageHeight - margin) {
      doc.addPage();
      leftCurrY = margin + 5;
    }
    doc.text(termsLines[i], margin, leftCurrY);
    leftCurrY += lineSpacing;
  }

  // Signature on Bottom Right
  const sigX = pageWidth - margin - 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(20, 20, 20);
  doc.text('For CAPSULE COMPANY', sigX, footerY + 1.5);

  const signatoryName = (company.authorizedSignatory && !company.authorizedSignatory.toLowerCase().includes('authorized signatory') && !company.authorizedSignatory.toLowerCase().includes('authorized signature'))
    ? company.authorizedSignatory
    : 'Kishmat Sah Thakuri';

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(8.8);
  doc.setTextColor(40, 40, 40);
  doc.text(signatoryName, sigX, footerY + 8);

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(sigX, footerY + 10, pageWidth - margin, footerY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 110);
  doc.text(signatoryName, sigX + 2, footerY + 13);

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
  const upiId = company.upiId || 'poornesh43-3@oksbi';
  const amount = isQuotation ? undefined : (data.balanceDue ?? data.roundedGrandTotal);
  const docNumber = isQuotation ? data.quotationNumber : data.invoiceNumber;
  const finalUpiQr = upiQrBase64 || await generateUpiQrDataUrl({
    upiId,
    name: company.accountName || 'Mr. Poornesh Bakila Babu',
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

/**
 * Build Single A4 Page Payment Receipt Voucher PDF
 */
export function buildReceiptPDFDoc({ data, logoBase64 }: { data: any; logoBase64?: string }): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const company = data.companySettings || {
    companyName: 'CAPSULE COMPANY',
    tagline: 'YOUR SPACE MAKER',
    address: 'N.17/3, 1st & 2nd Floor, SLV Complex, Hebbal Kempapura, Amanikere, Outer Ring Road, Bengaluru, Karnataka – 560024',
    phone: '9187924723, 9187924523, 9187924623',
    email: 'workscapsule@gmail.com',
  };

  // 1. TOP HEADER (MODERN EDITORIAL BRANDING)
  const logoSize = 24;
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
      const img = document.querySelector('img[alt="Capsule Logo"]') as HTMLImageElement ||
                  document.querySelector('img[alt="Capsule Company Logo"]') as HTMLImageElement;
      if (img && img.complete && img.naturalWidth > 0) {
        doc.addImage(img, 'PNG', logoX, logoY, logoSize, logoSize);
      }
    } catch (e) {
      console.warn('Logo DOM embed failed:', e);
    }
  }

  // Brand Name & Tagline under Logo on Left
  const logoCenterX = logoX + logoSize / 2;
  const brandNameY = logoY + logoSize + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(26, 24, 23);
  doc.text((company.companyName || 'CAPSULE COMPANY').toUpperCase(), logoCenterX, brandNameY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(200, 138, 110); // Brand copper
  doc.text((company.tagline || 'YOUR SPACE MAKER').toUpperCase(), logoCenterX, brandNameY + 2.8, { align: 'center', charSpace: 0.5 });

  // Document Title & Company Address on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(22, 20, 19);
  doc.text('PAYMENT RECEIPT VOUCHER', pageWidth - margin, margin + 6, { align: 'right', charSpace: 0.8 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(28, 25, 23);
  doc.text((company.companyName || 'CAPSULE COMPANY').toUpperCase(), pageWidth - margin, margin + 11.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(85, 80, 75);
  const addressLines = doc.splitTextToSize(
    company.address || 'N.17/3, 1st & 2nd Floor, SLV Complex, Hebbal Kempapura, Amanikere, Outer Ring Road, Bengaluru, Karnataka – 560024',
    95
  );
  let addrY = margin + 15.5;
  for (let i = 0; i < addressLines.length; i++) {
    doc.text(addressLines[i], pageWidth - margin, addrY, { align: 'right' });
    addrY += 2.9;
  }

  const contactY = addrY + 0.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(70, 65, 60);
  doc.text(
    `Contact: ${company.phone || '9187924723, 9187924523, 9187924623'}  |  Email: ${company.email || 'workscapsule@gmail.com'}`,
    pageWidth - margin,
    contactY,
    { align: 'right' }
  );

  // Thin Separator Line
  const headerBottomY = Math.max(contactY + 3.5, brandNameY + 5.5);
  doc.setDrawColor(226, 221, 213);
  doc.setLineWidth(0.35);
  doc.line(margin, headerBottomY, pageWidth - margin, headerBottomY);

  // 2. METADATA STRIP (4 Columns)
  const metaY = headerBottomY + 2.5;
  const metaHeight = 10;
  doc.setFillColor(250, 247, 242); // Warm cream fill
  doc.setDrawColor(226, 221, 213);
  doc.roundedRect(margin, metaY, contentWidth, metaHeight, 1.5, 1.5, 'FD');

  const colW = contentWidth / 4;
  // Col 1: Receipt Number (highlighted)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(120, 113, 108);
  doc.text('RECEIPT NUMBER', margin + 3, metaY + 3.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(169, 104, 76); // Copper highlight
  doc.text(data.receiptNumber || 'CAP-REC-0001', margin + 3, metaY + 8);

  // Col 2: Receipt Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(120, 113, 108);
  doc.text('RECEIPT DATE', margin + colW + 3, metaY + 3.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(28, 25, 23);
  doc.text(formatDateDDMMYYYY(data.receiptDate || data.createdAt), margin + colW + 3, metaY + 8);

  // Col 3: Quotation Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(120, 113, 108);
  doc.text('RELATED QUOTATION', margin + colW * 2 + 3, metaY + 3.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(28, 25, 23);
  doc.text(data.quotationNumber || data.quotation?.quotationNumber || 'N/A', margin + colW * 2 + 3, metaY + 8);

  // Col 4: Invoice Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(120, 113, 108);
  doc.text('INVOICE NUMBER', margin + colW * 3 + 3, metaY + 3.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(28, 25, 23);
  doc.text(data.invoiceNumber || data.invoice?.invoiceNumber || 'N/A', margin + colW * 3 + 3, metaY + 8);

  // 3. TWO-COLUMN BOX: CUSTOMER DETAILS & PROJECT LOCATION
  const custBoxY = metaY + metaHeight + 3;
  const custBoxHeight = 25;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 221, 213);
  doc.roundedRect(margin, custBoxY, contentWidth, custBoxHeight, 1.5, 1.5, 'FD');

  // Vertical divider between customer and project
  const halfCol = contentWidth / 2;
  doc.setDrawColor(235, 231, 225);
  doc.line(margin + halfCol, custBoxY + 2.5, margin + halfCol, custBoxY + custBoxHeight - 2.5);

  // Left Column: Customer Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(120, 113, 108);
  doc.text('CUSTOMER DETAILS', margin + 4, custBoxY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 18, 17);
  doc.text(data.customerName || data.customer?.name || 'Valued Client', margin + 4, custBoxY + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(75, 70, 65);
  doc.text(`Contact: ${data.customerPhone || data.customer?.phone || '-'}`, margin + 4, custBoxY + 14);

  const rawAddress = data.customerAddress || data.customer?.address || 'Bengaluru, Karnataka';
  const custAddrLines = doc.splitTextToSize(rawAddress, halfCol - 8);
  let addrLineY = custBoxY + 18;
  for (let i = 0; i < Math.min(custAddrLines.length, 2); i++) {
    doc.text(custAddrLines[i], margin + 4, addrLineY);
    addrLineY += 3;
  }

  // Right Column: Project & Site Location
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(120, 113, 108);
  doc.text('PROJECT & SITE LOCATION', margin + halfCol + 4, custBoxY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 18, 17);
  doc.text(data.projectName || data.project?.name || 'Interior Work', margin + halfCol + 4, custBoxY + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(75, 70, 65);
  doc.text(`Site Location: ${data.projectLocation || data.project?.location || 'Bengaluru'}`, margin + halfCol + 4, custBoxY + 14);

  if (data.paymentPurpose) {
    doc.text(`Payment Purpose: ${data.paymentPurpose}`, margin + halfCol + 4, custBoxY + 18);
  }

  // 4. PAYMENT DETAILS HIGHLIGHT CARD
  const payCardY = custBoxY + custBoxHeight + 3;
  const payCardHeight = 22;
  doc.setFillColor(250, 247, 242); // Warm subtle cream
  doc.setDrawColor(218, 209, 198);
  doc.roundedRect(margin, payCardY, contentWidth, payCardHeight, 2, 2, 'FD');

  // Left Section of Payment Card: Amount Received (Big & Highlighted)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 113, 108);
  doc.text('AMOUNT RECEIVED', margin + 4, payCardY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(169, 104, 76); // Brand copper-gold
  const formattedAmt = formatPdfCurrency(data.amountReceived ?? data.currentPaymentReceived ?? 0);
  doc.text(formattedAmt, margin + 4, payCardY + 14);

  // Vertical separator in payment card
  const paySplitX = margin + 68;
  doc.setDrawColor(226, 221, 213);
  doc.line(paySplitX, payCardY + 2.5, paySplitX, payCardY + payCardHeight - 2.5);

  // Right Section: Payment Date, Mode, Transaction ID
  const rightPayX = paySplitX + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(115, 108, 102);
  doc.text('Payment Date:', rightPayX, payCardY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(25, 23, 22);
  doc.text(formatDateDDMMYYYY(data.paymentDate || data.createdAt), rightPayX + 22, payCardY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(115, 108, 102);
  doc.text('Payment Mode:', rightPayX, payCardY + 10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(25, 23, 22);
  doc.text(data.paymentMode || 'Bank Transfer', rightPayX + 22, payCardY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(115, 108, 102);
  doc.text('Transaction / Ref ID:', rightPayX, payCardY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(25, 23, 22);
  doc.text(data.transactionId || 'N/A', rightPayX + 29, payCardY + 15.5);

  // 5. AMOUNT IN WORDS BOX
  const wordsY = payCardY + payCardHeight + 2.5;
  const wordsHeight = 11;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 221, 213);
  doc.roundedRect(margin, wordsY, contentWidth, wordsHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(120, 113, 108);
  doc.text('AMOUNT IN WORDS:', margin + 3.5, wordsY + 3.8);

  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(40, 36, 34);
  const wordsText = data.amountInWords || numberToWordsINR(data.amountReceived ?? data.currentPaymentReceived ?? 0);
  const wordsLines = doc.splitTextToSize(wordsText, contentWidth - 7);
  doc.text(wordsLines[0] || '', margin + 3.5, wordsY + 8);

  // 6. PAYMENT SUMMARY TABLE
  const summaryTableY = wordsY + wordsHeight + 2.5;

  const totalProject = Number(data.totalProjectAmount || 0);
  const prevPaid = Number(data.previousPaymentsReceived || 0);
  const currPaid = Number(data.currentPaymentReceived ?? data.amountReceived ?? 0);
  const totalPaid = Number((prevPaid + currPaid).toFixed(2));
  const remaining = Number((totalProject - totalPaid).toFixed(2));

  const tableBody = [
    ['Total Project Amount', formatPdfCurrency(totalProject)],
    ['Previous Payments Received', formatPdfCurrency(prevPaid)],
    ['Current Payment Received', formatPdfCurrency(currPaid)],
    ['Total Payments Received', formatPdfCurrency(totalPaid)],
    ['Remaining Balance', formatPdfCurrency(remaining)],
  ];

  autoTable(doc, {
    startY: summaryTableY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [['FINANCIAL SUMMARY COMPONENT', 'AMOUNT (INR)']],
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: [26, 24, 23],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 120, halign: 'left' },
      1: { cellWidth: 62, halign: 'right', fontStyle: 'bold' },
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [35, 32, 30],
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
    },
    didParseCell: (dataCell: any) => {
      if (dataCell.section === 'head' && dataCell.column.index === 1) {
        if (dataCell.cell && dataCell.cell.styles) dataCell.cell.styles.halign = 'right';
      }
      if (dataCell.section === 'body') {
        const rowIdx = dataCell.row.index;
        // Total payments received bold
        if (rowIdx === 3 && dataCell.cell && dataCell.cell.styles) {
          dataCell.cell.styles.fontStyle = 'bold';
          dataCell.cell.styles.fillColor = [250, 247, 242];
        }
        // Remaining Balance highlighted
        if (rowIdx === 4 && dataCell.cell && dataCell.cell.styles) {
          dataCell.cell.styles.fontStyle = 'bold';
          dataCell.cell.styles.fillColor = [253, 246, 240];
          dataCell.cell.styles.textColor = [169, 104, 76]; // Copper highlight
        }
      }
    },
  });

  const lastTableY = (doc as any).lastAutoTable?.finalY || (summaryTableY + 36);

  // 7. RECEIPT CONFIRMATION STATEMENT (Requirement 6)
  const confY = lastTableY + 2.5;
  const confHeight = 14;
  doc.setFillColor(250, 247, 242);
  doc.setDrawColor(218, 209, 198);
  doc.roundedRect(margin, confY, contentWidth, confHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(169, 104, 76);
  doc.text('OFFICIAL RECEIPT CONFIRMATION', margin + 3.5, confY + 3.8);

  const custName = data.customerName || data.customer?.name || 'Customer';
  const projName = data.projectName || data.project?.name || 'Project';
  const payMode = data.paymentMode || 'Bank Transfer';
  const payDateStr = formatDateDDMMYYYY(data.paymentDate || data.receiptDate || data.createdAt);

  const confirmationStatement = `We acknowledge receipt of ${formattedAmt} (${wordsText}) from ${custName} towards ${projName} via ${payMode} on ${payDateStr}.`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(45, 40, 36);
  const confLines = doc.splitTextToSize(confirmationStatement, contentWidth - 7);
  let confLineY = confY + 7.5;
  for (let i = 0; i < Math.min(confLines.length, 2); i++) {
    doc.text(confLines[i], margin + 3.5, confLineY);
    confLineY += 3.2;
  }

  // 8. REMARKS / DESCRIPTION (if present)
  let remarksEnd = confY + confHeight;
  if (data.remarks && data.remarks.trim()) {
    const remY = remarksEnd + 1.8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(120, 113, 108);
    doc.text('REMARKS / DESCRIPTION:', margin, remY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(60, 55, 50);
    const remLines = doc.splitTextToSize(data.remarks.trim(), contentWidth);
    doc.text(remLines[0] || '', margin, remY + 3.2);
    remarksEnd = remY + 4;
  }

  // 9. SIGNATURE SECTION (Requirement 7 - 4 Designated Spaces)
  const sigY = Math.max(remarksEnd + 4, 236);
  const sigColW = contentWidth / 4; // ~45.5mm each

  const voucherSignatory = (company.authorizedSignatory && !company.authorizedSignatory.toLowerCase().includes('authorized signatory'))
    ? company.authorizedSignatory
    : 'Kishmat Sah Thakuri';

  const sigLabels = [
    { title: 'Received By', sub: data.receivedBy || 'CAPSULE COMPANY' },
    { title: 'Customer Signature', sub: '(Authorized Customer)' },
    { title: voucherSignatory, sub: 'For CAPSULE COMPANY' },
    { title: 'Company Stamp', sub: '(Official Seal)' },
  ];

  sigLabels.forEach((item, idx) => {
    const sx = margin + idx * sigColW;
    const lineStartX = sx + 2;
    const lineEndX = sx + sigColW - 2;
    const lineY = sigY + 12;

    // Signature space line
    doc.setDrawColor(180, 175, 168);
    doc.setLineWidth(0.3);
    doc.line(lineStartX, lineY, lineEndX, lineY);

    // Title label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 27, 25);
    doc.text(item.title, (lineStartX + lineEndX) / 2, lineY + 3.5, { align: 'center' });

    // Sub label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(120, 113, 108);
    doc.text(item.sub, (lineStartX + lineEndX) / 2, lineY + 6.5, { align: 'center' });
  });

  // 10. FOOTER (Requirement 8)
  const footerY = 268;
  doc.setDrawColor(226, 221, 213);
  doc.setLineWidth(0.35);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(26, 24, 23);
  doc.text('Thank you for choosing Capsule Company!', pageWidth / 2, footerY + 4, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(200, 138, 110); // Brand copper
  doc.text('YOUR SPACE MAKER', pageWidth / 2, footerY + 7.5, { align: 'center', charSpace: 0.8 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(115, 108, 102);
  doc.text(
    `Contact: ${company.phone || '9187924723, 9187924523, 9187924623'}  |  Email: ${company.email || 'workscapsule@gmail.com'}`,
    pageWidth / 2,
    footerY + 11,
    { align: 'center' }
  );

  // Guarantee single page output: if extra page was somehow generated, remove it
  const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : 1;
  if (pageCount > 1) {
    for (let p = pageCount; p > 1; p--) {
      doc.deletePage(p);
    }
  }

  return doc;
}

/**
 * Download Receipt PDF in Browser
 */
export async function generateAndDownloadReceiptPDF({ data }: { data: any }): Promise<void> {
  let logoBase64: string | undefined;

  if (typeof document !== 'undefined') {
    try {
      const img = document.querySelector('img[alt="Capsule Logo"]') as HTMLImageElement ||
                  document.querySelector('img[alt="Capsule Company Logo"]') as HTMLImageElement;
      if (img && img.src) {
        const b64 = await getBase64ImageFromUrl(img.src);
        if (b64) logoBase64 = b64;
      } else {
        const b64 = await getBase64ImageFromUrl('/capsule-logo.png');
        if (b64) logoBase64 = b64;
      }
    } catch (e) {
      console.warn('Could not load logo for client PDF:', e);
    }
  }

  const doc = buildReceiptPDFDoc({ data, logoBase64 });
  const filename = `${data.receiptNumber || 'PAYMENT-RECEIPT'}.pdf`;

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

