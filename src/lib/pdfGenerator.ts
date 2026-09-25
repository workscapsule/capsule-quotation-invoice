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
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const company = data.companySettings || {
    companyName: 'CAPSULE COMPANY',
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

  // Embed company logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, margin, 18, 18);
    } catch (e) {
      console.warn('Logo embed skipped in PDF:', e);
    }
  } else if (typeof document !== 'undefined') {
    try {
      const img = document.querySelector('img[alt="Capsule Logo"]') as HTMLImageElement;
      if (img && img.complete && img.naturalWidth > 0) {
        doc.addImage(img, 'PNG', margin, margin, 18, 18);
      }
    } catch (e) {
      console.warn('Logo embed skipped in PDF:', e);
    }
  }

  // --- HEADER SECTION ---
  const headerLeftX = margin + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(23, 21, 20); // #171514
  doc.text(company.companyName, headerLeftX, margin + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 138, 110); // #C88A6E
  doc.text(company.tagline || 'YOUR SPACE MAKER', headerLeftX, margin + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(90, 85, 82);
  const addressLines = doc.splitTextToSize(company.address, 95);
  doc.text(addressLines, headerLeftX, margin + 13);

  const contactY = margin + 13 + addressLines.length * 3.2;
  doc.text(`Phone: ${company.phone}  |  Email: ${company.email}`, headerLeftX, contactY);
  if (company.gstin) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 45, 42);
    doc.text(`GSTIN: ${company.gstin}`, headerLeftX, contactY + 3.5);
  }

  // --- DOCUMENT META BOX (Right Aligned) ---
  const metaBoxWidth = 55;
  const metaBoxX = pageWidth - margin - metaBoxWidth;
  const metaBoxY = margin;

  doc.setFillColor(250, 247, 242); // #FAF7F2
  doc.setDrawColor(200, 138, 110); // #C88A6E
  doc.setLineWidth(0.4);
  doc.roundedRect(metaBoxX, metaBoxY, metaBoxWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(179, 115, 86); // #B37356
  doc.text(isQuotation ? 'QUOTATION' : 'TAX INVOICE', metaBoxX + metaBoxWidth / 2, metaBoxY + 5.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23, 21, 20);
  doc.text(isQuotation ? data.quotationNumber : data.invoiceNumber, metaBoxX + metaBoxWidth / 2, metaBoxY + 10.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(90, 85, 82);

  const dateStr = formatDate(isQuotation ? data.quotationDate : data.invoiceDate);
  const dueDateStr = formatDate(isQuotation ? data.validUntil : data.dueDate);

  doc.text(`Date: ${dateStr}`, metaBoxX, metaBoxY + 19);
  doc.text(`${isQuotation ? 'Valid Until: ' : 'Due Date: '}${dueDateStr}`, metaBoxX, metaBoxY + 23);
  if (!isQuotation && data.quotation?.quotationNumber) {
    doc.text(`Ref Quote: ${data.quotation.quotationNumber}`, metaBoxX, metaBoxY + 27);
  }

  // --- HORIZONTAL DIVIDER ---
  const lineY = margin + 34;
  doc.setDrawColor(232, 226, 217); // #E8E2D9
  doc.setLineWidth(0.5);
  doc.line(margin, lineY, pageWidth - margin, lineY);

  // --- CLIENT & PROJECT DETAILS BOXES (Two Columns) ---
  const infoBoxY = lineY + 3;
  const boxWidth = (contentWidth - 4) / 2;
  const boxHeight = 28;

  // Box 1: Customer Details
  doc.setFillColor(250, 247, 242);
  doc.setDrawColor(232, 226, 217);
  doc.roundedRect(margin, infoBoxY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(200, 138, 110);
  doc.text('BILL TO / CUSTOMER DETAILS', margin + 3, infoBoxY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(23, 21, 20);
  doc.text(data.customer?.name || 'Valued Customer', margin + 3, infoBoxY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 65, 60);

  const custAddr = data.customerAddress || data.customer?.address || 'Site Address';
  const custAddrLines = doc.splitTextToSize(custAddr, boxWidth - 6);
  doc.text(custAddrLines.slice(0, 2), margin + 3, infoBoxY + 13);

  const phoneY = infoBoxY + 13 + Math.min(custAddrLines.length, 2) * 3.3;
  const custPhone = data.customerPhone || data.customer?.phone || '-';
  doc.text(`Phone: ${custPhone}`, margin + 3, phoneY);

  if (data.customerEmail) {
    doc.text(`Email: ${data.customerEmail}`, margin + 3, phoneY + 3.5);
  } else if (data.customerGstin) {
    doc.text(`GSTIN: ${data.customerGstin}`, margin + 3, phoneY + 3.5);
  }

  // Box 2: Project Details
  const box2X = margin + boxWidth + 4;
  doc.setFillColor(250, 247, 242);
  doc.roundedRect(box2X, infoBoxY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(200, 138, 110);
  doc.text('PROJECT & SITE LOCATION', box2X + 3, infoBoxY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(23, 21, 20);
  doc.text(data.project?.name || 'Interior Project', box2X + 3, infoBoxY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 65, 60);
  const projLoc = data.projectLocation || data.project?.location || 'Bengaluru';
  const projLocLines = doc.splitTextToSize(`Site Location: ${projLoc}`, boxWidth - 6);
  doc.text(projLocLines, box2X + 3, infoBoxY + 13);

  doc.text(`Project Type: ${data.project?.projectType || 'Interior Work'}`, box2X + 3, infoBoxY + 21);

  // --- WORK ITEMS TABLE ---
  const items = Array.isArray(data.items) ? data.items : [];
  const tableRows = items.map((item: any, idx: number) => {
    const scopeText = item.type
      ? `${item.type}${item.description ? `\n${item.description}` : ''}`
      : item.description || '-';

    return [
      String(idx + 1),
      item.categoryName || '-',
      scopeText,
      String(item.quantity ?? 1),
      item.unit || 'Nos',
      formatCurrency(item.rate ?? 0),
      formatCurrency(item.amount ?? 0),
    ];
  });

  const tableStartY = infoBoxY + boxHeight + 4;

  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'Category', 'Scope & Requirement Description', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [23, 21, 20],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [35, 30, 28],
      cellPadding: 2.5,
      valign: 'top',
    },
    alternateRowStyles: {
      fillColor: [253, 252, 250],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  // Position after table
  let currentY = (doc as any).lastAutoTable?.finalY || tableStartY + 20;

  // Check if totals section will overflow the page
  const totalsSectionHeight = 85;
  if (currentY + totalsSectionHeight > pageHeight - margin) {
    doc.addPage();
    currentY = margin + 5;
  }

  // --- FINANCIAL TOTALS BOX (Right Aligned) ---
  const totalsBoxWidth = 85;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;
  const totalsBoxY = currentY + 3;

  doc.setFillColor(250, 247, 242);
  doc.setDrawColor(232, 226, 217);

  // Calculate totals rows
  const subtotal = data.subtotal ?? 0;
  const discountAmount = data.discountAmount ?? 0;
  const taxableAmount = data.taxableAmount ?? subtotal - discountAmount;
  const cgstAmount = data.cgstAmount ?? 0;
  const sgstAmount = data.sgstAmount ?? 0;
  const igstAmount = data.igstAmount ?? 0;
  const otherChargesAmount = data.otherChargesAmount ?? 0;
  const grandTotal = data.roundedGrandTotal ?? data.grandTotal ?? 0;

  let rowY = totalsBoxY + 4;
  doc.setFontSize(7.5);

  const drawTotalLine = (label: string, value: string, isBold = false, isAccent = false, isNegative = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    if (isAccent) doc.setTextColor(179, 115, 86);
    else if (isNegative) doc.setTextColor(180, 50, 50);
    else doc.setTextColor(70, 65, 60);

    doc.text(label, totalsBoxX + 4, rowY);
    doc.text(value, totalsBoxX + totalsBoxWidth - 4, rowY, { align: 'right' });
    rowY += 4.2;
  };

  drawTotalLine('Subtotal:', formatCurrency(subtotal));

  if (discountAmount > 0) {
    drawTotalLine(`Discount (${data.discountType === 'PERCENTAGE' ? `${data.discountValue}%` : 'Fixed'}):`, `- ${formatCurrency(discountAmount)}`, false, false, true);
    drawTotalLine('Taxable Amount:', formatCurrency(taxableAmount), true);
  }

  if (data.taxMode === 'CGST_SGST') {
    const halfGst = (data.gstRate || 18) / 2;
    drawTotalLine(`CGST (${halfGst}%):`, formatCurrency(cgstAmount));
    drawTotalLine(`SGST (${halfGst}%):`, formatCurrency(sgstAmount));
  } else if (data.taxMode === 'IGST') {
    drawTotalLine(`IGST (${data.gstRate || 18}%):`, formatCurrency(igstAmount));
  }

  if (otherChargesAmount > 0) {
    const charges = Array.isArray(data.additionalCharges) ? data.additionalCharges : [];
    if (charges.length > 0) {
      charges.forEach((ch: any) => {
        drawTotalLine(`${ch.description || 'Charge'}:`, formatCurrency(ch.amount));
      });
    } else {
      drawTotalLine('Other Charges:', formatCurrency(otherChargesAmount));
    }
  }

  // Grand Total Line with distinct highlight
  rowY += 1;
  doc.setDrawColor(200, 138, 110);
  doc.line(totalsBoxX + 2, rowY - 1, totalsBoxX + totalsBoxWidth - 2, rowY - 1);
  rowY += 3.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 21, 20);
  doc.text('Grand Total:', totalsBoxX + 4, rowY);
  doc.text(formatCurrency(grandTotal), totalsBoxX + totalsBoxWidth - 4, rowY, { align: 'right' });
  rowY += 4.5;

  // Invoice Specific Balance Due
  if (!isQuotation) {
    const totalPaid = data.totalPaid ?? 0;
    const balanceDue = data.balanceDue ?? grandTotal - totalPaid;
    drawTotalLine('Total Paid to Date:', formatCurrency(totalPaid));
    drawTotalLine('Balance Due:', formatCurrency(balanceDue), true, true);
  }

  // Draw background box for totals
  const totalBoxFinalHeight = rowY - totalsBoxY + 2;
  doc.roundedRect(totalsBoxX, totalsBoxY, totalsBoxWidth, totalBoxFinalHeight, 2, 2, 'D');

  // --- LEFT SIDE: AMOUNT IN WORDS & BANK DETAILS ---
  const leftSideWidth = contentWidth - totalsBoxWidth - 6;
  const leftX = margin;
  let leftY = totalsBoxY;

  // Amount in words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 138, 110);
  doc.text('AMOUNT IN WORDS:', leftX, leftY + 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(23, 21, 20);
  const words = numberToWordsINR(grandTotal);
  const wordLines = doc.splitTextToSize(words, leftSideWidth);
  doc.text(wordLines, leftX, leftY + 7.5);
  leftY += 9 + wordLines.length * 3.5;

  // Bank & Payment Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 138, 110);
  doc.text('BANK & PAYMENT DETAILS:', leftX, leftY);
  leftY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 55, 52);
  doc.text(`Bank Name: ${company.bankName || 'HDFC Bank'}  |  Branch: ${company.branch || 'Bengaluru'}`, leftX, leftY);
  leftY += 3.8;
  doc.text(`Account Name: ${company.accountName || company.companyName}`, leftX, leftY);
  leftY += 3.8;
  doc.text(`A/C No: ${company.accountNumber || '50200034981276'}  |  IFSC: ${company.ifscCode || 'HDFC0001245'}`, leftX, leftY);
  leftY += 3.8;
  if (company.upiId) {
    doc.text(`UPI ID: ${company.upiId}`, leftX, leftY);
    leftY += 3.8;
  }

  // Advance Y below both columns
  currentY = Math.max(leftY, totalsBoxY + totalBoxFinalHeight) + 4;

  // Check overflow before Terms and Conditions
  if (currentY + 30 > pageHeight - margin) {
    doc.addPage();
    currentY = margin + 5;
  }

  // --- TERMS & CONDITIONS ---
  doc.setDrawColor(232, 226, 217);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 138, 110);
  doc.text('TERMS & CONDITIONS:', margin, currentY);
  currentY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 75, 72);
  const terms = data.termsAndConditions || company.defaultTerms || '1. Quotation valid for 30 days.\n2. 50% advance to commence work.';
  const termsLines = doc.splitTextToSize(terms, contentWidth - 45);
  doc.text(termsLines.slice(0, 5), margin, currentY);

  // --- AUTHORIZED SIGNATORY (Bottom Right) ---
  const sigX = pageWidth - margin - 50;
  const sigY = currentY + 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 95, 90);
  doc.text(company.authorizedSignatory || 'For CAPSULE COMPANY', sigX, sigY);
  doc.text('(Authorized Signatory)', sigX + 6, sigY + 4);

  // --- FOOTER (Page Numbering & Copyright) ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(140, 135, 130);
    doc.text(
      `Capsule Company  •  N.173, 1st & 2nd Flr, SLV Complex, Hebbal Kempapura, Bengaluru  •  +91 96321 24422  •  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

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

