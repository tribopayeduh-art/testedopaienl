/**
 * Utility functions for validating, formatting, and generating WhatsApp links for Brazilian phone numbers.
 */

export function cleanPhoneDigits(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

export function isValidBrazilianPhone(phone: string): boolean {
  const digits = cleanPhoneDigits(phone);
  if (digits.length === 10 || digits.length === 11) return true;
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return true;
  return digits.length >= 8 && digits.length <= 15;
}

export function healPhoneNumber(phone: string): string {
  let digits = cleanPhoneDigits(phone);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  return digits;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = healPhoneNumber(phone);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function getWhatsAppNumber(phone: string): string {
  let digits = cleanPhoneDigits(phone);
  if (!digits.startsWith('55')) {
    digits = '55' + digits;
  }
  return digits;
}

export function getWhatsAppLink(phone: string, text?: string): string {
  const num = getWhatsAppNumber(phone);
  const msg = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${num}${msg}`;
}
