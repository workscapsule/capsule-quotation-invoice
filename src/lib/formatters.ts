/**
 * Format numbers into Indian Rupee currency string: ₹1,23,456.00
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format numbers with Indian comma separators without symbol
 */
export function formatIndianNumber(val: number | string | null | undefined): string {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format Date to readable format: 25 Aug 2026
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Input date helper for YYYY-MM-DD
 */
export function toInputDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}
