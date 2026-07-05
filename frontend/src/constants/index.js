// Product tag constants
export const PRODUCT_TAGS = [
  { value: 'best_seller', label: 'Best Seller', badge: 'badge--best-seller', icon: '🔥' },
  { value: 'new', label: 'New', badge: 'badge--new', icon: '✨' },
  { value: 'limited', label: 'Limited', badge: 'badge--limited', icon: '⏳' },
  { value: 'trending', label: 'Trending', badge: 'badge--trending', icon: '📈' },
  { value: 'popular', label: 'Popular', badge: 'badge--popular', icon: '⭐' },
  { value: 'festival_offer', label: 'Festival Offer', badge: 'badge--festival', icon: '🎆' },
];

export const ORDER_STATUSES = [
  { value: 'new', label: 'New', customerLabel: 'Received', color: '#2563eb' },
  { value: 'confirmed', label: 'Confirmed', customerLabel: 'Confirmed', color: '#059669' },
  { value: 'paid', label: 'Paid', customerLabel: 'Paid', color: '#047857' },
  { value: 'cancelled', label: 'Cancelled', customerLabel: 'Cancelled', color: '#dc2626' },
];

export const PAYMENT_METHODS = [
  { value: 'not_received', label: 'Payment not received yet' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
];

// Legacy status mapping (backward compatibility)
export const LEGACY_STATUS_MAP = {
  called_customer: 'new',
  waiting_confirmation: 'new',
  contacted: 'new',
  packed: 'confirmed',
  completed: 'confirmed',
  confirmed: 'confirmed',
  paid: 'paid',
  cancelled: 'cancelled',
  new: 'new',
};

export function normalizeOrderStatus(status) {
  return LEGACY_STATUS_MAP[status] || status;
}

export function getEffectivePaymentMethod(order) {
  if (!order) return 'not_received';
  const method = order.payment_method || 'not_received';
  const txnId = order.payment_transaction_id?.trim();
  if ((method === 'upi' || method === 'bank_transfer') && !txnId) {
    return 'not_received';
  }
  if (method === 'cash') return 'cash';
  if (method === 'upi' || method === 'bank_transfer') return method;
  return 'not_received';
}

export function isPaymentReceived(order) {
  if (!order) return false;
  if (normalizeOrderStatus(order.status) === 'paid') return true;
  return getEffectivePaymentMethod(order) !== 'not_received';
}

export function getPaymentStatusLabel(order) {
  return isPaymentReceived(order) ? 'Paid' : 'Payment not received yet';
}

export function getPaymentMethodDetail(order) {
  if (!isPaymentReceived(order)) return '';
  const method = getEffectivePaymentMethod(order);
  return PAYMENT_METHODS.find((m) => m.value === method)?.label || '';
}

export function getPaymentMethodLabel(order) {
  return getPaymentStatusLabel(order);
}

export const CATEGORY_ICONS = {
  'lakshmi-crackers': '🪔',
  'bijili': '⚡',
  'flower-pots': '🌸',
  'rockets': '🚀',
  'bombs': '💣',
  'ground-chakkars': '🌀',
  'kids-special': '👶',
  'gift-boxes': '🎁',
  'fancy-crackers': '✨',
  'sparklers': '🎇',
};

export const FAQ_ITEMS = [
  {
    q: 'How do I place an order?',
    a: 'Browse products, add to cart, fill your details at checkout, and submit. We will call or WhatsApp you to confirm.',
  },
  {
    q: 'Is online payment available?',
    a: 'No online payment. After placing your order, our team contacts you to confirm and arrange payment/delivery.',
  },
  {
    q: 'Do you deliver across India?',
    a: 'Yes, we deliver across India. Delivery charges and timelines depend on your location.',
  },
  {
    q: 'Are your crackers from Sivakasi?',
    a: 'Yes! All our crackers are sourced directly from Sivakasi, Tamil Nadu — the fireworks capital of India.',
  },
  {
    q: 'How can I track my order?',
    a: 'Use the Track Order page with your order number and phone number to see current status.',
  },
];

export const WHY_US = [
  { icon: '🏭', title: 'Direct from Sivakasi', desc: 'Premium quality crackers at factory prices' },
  { icon: '💰', title: 'Up to 80% Off', desc: 'Best discounts on all categories' },
  { icon: '📞', title: 'Personal Support', desc: 'Call or WhatsApp us anytime' },
  { icon: '🚚', title: 'Pan-India Delivery', desc: 'Safe and timely delivery' },
];
