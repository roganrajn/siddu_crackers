/**
 * WhatsApp service — abstraction layer for future WhatsApp Business Cloud API.
 *
 * Current: build links for wa.me deep links.
 * Future: replace sendWhatsAppCloudAPI() internals without changing callers.
 */

export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

export function buildWhatsAppLink(phone, message = '') {
  const clean = cleanPhoneNumber(phone);
  if (!clean) return null;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}${message ? `?text=${encoded}` : ''}`;
}

/**
 * Build the standard order confirmation message for customers.
 */
export function buildOrderWhatsAppMessage({ orderNumber, customerName, phone, totalAmount }) {
  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(totalAmount);

  return `Hello Siddu Crackers,

I have placed an order.

Order Number:
${orderNumber}

Customer Name:
${customerName}

Phone:
${phone}

Total Amount:
${formattedTotal}

Please confirm my order.

Thank you.`;
}

/**
 * Future: WhatsApp Business Cloud API integration point.
 * @param {string} to - recipient phone
 * @param {string} message - message body
 */
export async function sendWhatsAppCloudAPI(to, message) {
  // Placeholder for future WhatsApp Business Cloud API
  console.log('[whatsapp] Cloud API not configured. Would send to:', to);
  return { success: false, reason: 'not_configured' };
}

export default { cleanPhoneNumber, buildWhatsAppLink, buildOrderWhatsAppMessage, sendWhatsAppCloudAPI };
