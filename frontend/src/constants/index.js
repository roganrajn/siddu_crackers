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
  { value: 'contacted', label: 'Contacted', customerLabel: 'Processing', color: '#d97706' },
  { value: 'confirmed', label: 'Confirmed', customerLabel: 'Confirmed', color: '#059669' },
  { value: 'packed', label: 'Packed', customerLabel: 'Packed', color: '#7c3aed' },
  { value: 'completed', label: 'Completed', customerLabel: 'Completed', color: '#374151' },
  { value: 'cancelled', label: 'Cancelled', customerLabel: 'Cancelled', color: '#dc2626' },
];

// Legacy status mapping (backward compatibility)
export const LEGACY_STATUS_MAP = {
  called_customer: 'contacted',
  waiting_confirmation: 'contacted',
  contacted: 'contacted',
  confirmed: 'confirmed',
  completed: 'completed',
  cancelled: 'cancelled',
  new: 'new',
  packed: 'packed',
};

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
