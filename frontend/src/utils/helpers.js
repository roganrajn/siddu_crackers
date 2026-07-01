export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const getWhatsAppLink = (phone, message = '') => {
  const digits = phone?.replace(/\D/g, '') || '';
  if (!digits) return null;
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}${message ? `?text=${encoded}` : ''}`;
};

export const getPhoneLink = (phone) => {
  return `tel:${phone?.replace(/\s/g, '')}`;
};

export const getOrderWhatsAppMessage = ({ orderNumber, customerName, phone, totalAmount }) => {
  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(totalAmount || 0);

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
};

export const getTagLabel = (tag) => {
  const labels = {
    best_seller: 'Best Seller', new: 'New', limited: 'Limited',
    trending: 'Trending', popular: 'Popular', festival_offer: 'Festival Offer',
  };
  return labels[tag] || tag;
};

export const getTagIcon = (tag) => {
  const icons = {
    best_seller: '🔥', new: '✨', limited: '⏳',
    trending: '📈', popular: '⭐', festival_offer: '🎆',
  };
  return icons[tag] || '🏷️';
};

export const slugify = (text) =>
  text?.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') || '';

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
