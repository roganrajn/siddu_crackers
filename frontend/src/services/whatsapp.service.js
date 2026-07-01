import { getWhatsAppLink } from '@/utils/helpers';

/**
 * Open WhatsApp with a pre-filled message.
 * Returns { success, error } — never throws.
 *
 * Future: swap internals for WhatsApp Business Cloud API without UI changes.
 */
export function openWhatsApp(phone, message = '') {
  const link = getWhatsAppLink(phone, message);

  if (!link || !phone?.replace(/\D/g, '')) {
    return {
      success: false,
      error: 'Unable to open WhatsApp. Please call our customer care number.',
    };
  }

  try {
    window.open(link, '_blank', 'noopener,noreferrer');
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Unable to open WhatsApp. Please call our customer care number.',
    };
  }
}

/**
 * Future: WhatsApp Business Cloud API — server-side send.
 */
export async function sendWhatsAppCloudAPI(_to, _message) {
  console.warn('[whatsapp] Cloud API not configured');
  return { success: false, reason: 'not_configured' };
}
