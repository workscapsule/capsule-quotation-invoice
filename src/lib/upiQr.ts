import QRCode from 'qrcode';

export interface UpiQrOptions {
  upiId: string;
  name: string;
  amount?: number;
  note?: string;
}

export function buildUpiUri({ upiId, name, amount, note }: UpiQrOptions): string {
  const cleanUpiId = (upiId || '').trim();
  if (!cleanUpiId) return '';

  const params = new URLSearchParams();
  params.set('pa', cleanUpiId);
  params.set('pn', name || 'CAPSULE COMPANY');
  params.set('cu', 'INR');
  if (amount && amount > 0) {
    params.set('am', amount.toFixed(2));
  }
  if (note) {
    params.set('tn', note);
  }
  return `upi://pay?${params.toString()}`;
}

export async function generateUpiQrDataUrl(options: UpiQrOptions): Promise<string> {
  const uri = buildUpiUri(options);
  if (!uri) return '';

  try {
    return await QRCode.toDataURL(uri, {
      width: 256,
      margin: 1,
      color: {
        dark: '#1c1917',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate UPI QR code:', err);
    return '';
  }
}
