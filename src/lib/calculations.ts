export interface LineItemInput {
  id?: string;
  categoryId?: string | null;
  categoryName: string;
  imageUrl?: string | null; // Product image path or URL
  type: string;         // FREE-TEXT user input
  description: string;  // FREE-TEXT user input
  sqFt?: number;        // Square Feet (Sq. Ft.)
  quantity?: number;    // Stored for database schema compatibility, represents Sq. Ft.
  unit?: string;        // Always 'Sq. Ft.'
  rate?: number;        // Internal price rate, not displayed
  amount: number;       // Direct Total Amount for the item
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
 * Pricing is fixed directly by the company via Total Amount per item.
 * Square Feet (Sq. Ft.) is displayed; Rate per Sq. Ft. is not displayed.
 * Discounts are removed.
 */
export function calculateFinancials(input: CalculationInput): CalculationResult {
  const items = (input.items || []).map((item, idx) => {
    const sqFt = Number(item.sqFt !== undefined ? item.sqFt : item.quantity) || 0;
    const amount = item.amount !== undefined && !isNaN(Number(item.amount))
      ? Math.round(Number(item.amount) * 100) / 100
      : Math.round(sqFt * (Number(item.rate) || 0) * 100) / 100;
    const rate = sqFt > 0 ? Math.round((amount / sqFt) * 100) / 100 : amount;

    return {
      ...item,
      sqFt,
      quantity: sqFt,
      unit: 'Sq. Ft.',
      rate,
      amount,
      sortOrder: item.sortOrder ?? idx + 1
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

  // Discount removed completely - always 0
  const discountAmount = 0;

  // Taxable amount equals subtotal (no discounts)
  const taxableAmount = Math.max(0, Math.round(subtotal * 100) / 100);

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
