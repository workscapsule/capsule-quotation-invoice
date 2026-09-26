export interface LineItemInput {
  id?: string;
  categoryId?: string | null;
  categoryName: string;
  imageUrl?: string | null; // Product image path or URL
  type: string;         // FREE-TEXT user input
  description: string;  // FREE-TEXT user input
  quantity: number;     // User entered
  unit: string;         // User selected/entered
  rate: number;         // STRICTLY USER ENTERED, NO PREDEFINED PRICES!
  amount?: number;      // Auto calculated: quantity * rate
  sortOrder?: number;
}

export interface AdditionalChargeInput {
  id?: string;
  description: string;
  amount: number;
}

export type TaxMode = 'CGST_SGST' | 'IGST' | 'EXEMPT';
export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'NONE';

export interface CalculationInput {
  items: LineItemInput[];
  additionalCharges?: AdditionalChargeInput[];
  discountType?: DiscountType;
  discountValue?: number;
  taxMode?: TaxMode;
  gstRate?: number;
  totalPaid?: number;
  dueDate?: string | Date;
}

export interface CalculationResult {
  items: (LineItemInput & { amount: number })[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  otherChargesAmount: number;
  grandTotal: number;
  roundedGrandTotal: number;
  totalPaid: number;
  balanceDue: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
}

/**
 * Pure calculation engine for Quotations and Invoices.
 * Adheres strictly to the business rule:
 * Rate is ALWAYS user entered. Amount = Quantity * Rate.
 */
export function calculateFinancials(input: CalculationInput): CalculationResult {
  const items = (input.items || []).map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const amount = Math.round(qty * rate * 100) / 100;
    return {
      ...item,
      quantity: qty,
      rate: rate,
      amount: amount,
      sortOrder: item.sortOrder ?? idx + 1
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

  // Discount calculation
  const discountType = input.discountType || 'NONE';
  const discountVal = Number(input.discountValue) || 0;
  let discountAmount = 0;

  if (discountType === 'PERCENTAGE') {
    discountAmount = Math.round(((subtotal * discountVal) / 100) * 100) / 100;
  } else if (discountType === 'FIXED') {
    discountAmount = Math.min(subtotal, Math.max(0, discountVal));
  }

  // Taxable amount
  const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  // Tax calculation
  const taxMode = input.taxMode || 'CGST_SGST';
  const gstRate = Number(input.gstRate ?? 18);
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (taxMode === 'CGST_SGST') {
    const halfRate = gstRate / 2;
    cgstAmount = Math.round(((taxableAmount * halfRate) / 100) * 100) / 100;
    sgstAmount = Math.round(((taxableAmount * halfRate) / 100) * 100) / 100;
    igstAmount = 0;
  } else if (taxMode === 'IGST') {
    cgstAmount = 0;
    sgstAmount = 0;
    igstAmount = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
  } else {
    // EXEMPT
    cgstAmount = 0;
    sgstAmount = 0;
    igstAmount = 0;
  }

  // Additional charges
  const charges = input.additionalCharges || [];
  const otherChargesAmount = charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  // Grand Total
  const grandTotal = Math.round((taxableAmount + cgstAmount + sgstAmount + igstAmount + otherChargesAmount) * 100) / 100;
  const roundedGrandTotal = Math.round(grandTotal);

  // Payments & Balance
  const totalPaid = Math.max(0, Number(input.totalPaid) || 0);
  const balanceDue = Math.max(0, roundedGrandTotal - totalPaid);

  // Payment Status
  let paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' = 'UNPAID';
  const isOverdue = input.dueDate ? new Date(input.dueDate).getTime() < new Date().setHours(0,0,0,0) : false;

  if (totalPaid >= roundedGrandTotal && roundedGrandTotal > 0) {
    paymentStatus = 'PAID';
  } else if (totalPaid > 0 && totalPaid < roundedGrandTotal) {
    paymentStatus = isOverdue ? 'OVERDUE' : 'PARTIALLY_PAID';
  } else if (totalPaid === 0) {
    paymentStatus = isOverdue && roundedGrandTotal > 0 ? 'OVERDUE' : 'UNPAID';
  }

  return {
    items,
    subtotal,
    discountAmount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    otherChargesAmount,
    grandTotal,
    roundedGrandTotal,
    totalPaid,
    balanceDue,
    paymentStatus
  };
}
