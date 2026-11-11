export type PricingMode = 'SQUARE_FEET' | 'QUANTITY';

export interface LineItemInput {
  id?: string;
  categoryId?: string | null;
  categoryName: string;
  imageUrl?: string | null; // Product image path or URL
  type: string;         // FREE-TEXT user input
  description: string;  // FREE-TEXT user input
  sqFt?: number;        // Square Feet (Sq. Ft.) measurement
  quantity?: number;    // Quantity or square feet for DB storage
  unit?: string;        // 'Sq. Ft.' or 'Nos' / custom unit
  rate?: number;        // Rate per Sq. Ft. or Rate per Unit
  amount?: number;      // Auto-calculated: measurement * rate
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
  pricingMode?: PricingMode;
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
 * Supports two selectable calculation modes:
 * 1. Square Feet Mode: Total Amount = Square Feet × Rate per Sq. Ft.
 * 2. Quantity Mode: Total Amount = Quantity × Rate per Unit
 */
export function calculateFinancials(input: CalculationInput): CalculationResult {
  const pricingMode: PricingMode = input.pricingMode || 'SQUARE_FEET';

  const items = (input.items || []).map((item, idx) => {
    let sqFt = Number(item.sqFt !== undefined ? item.sqFt : item.quantity) || 0;
    let qty = Number(item.quantity !== undefined ? item.quantity : item.sqFt) || 0;
    const rate = Number(item.rate) || 0;
    let amount = 0;
    let unit = item.unit || (pricingMode === 'SQUARE_FEET' ? 'Sq. Ft.' : 'Nos');

    if (pricingMode === 'SQUARE_FEET') {
      amount = Math.round(sqFt * rate * 100) / 100;
      qty = sqFt;
      unit = 'Sq. Ft.';
    } else {
      amount = Math.round(qty * rate * 100) / 100;
      sqFt = qty;
      if (!unit || unit === 'Sq. Ft.') unit = 'Nos';
    }

    return {
      ...item,
      sqFt,
      quantity: qty,
      unit,
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
