export const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `SID${year}${random}`;
};

export const roundMoney = (value) => {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
};

export const roundPercent = (value) => {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
};

export const calculateOfferPrice = (originalPrice, discountPercentage) => {
  const original = roundMoney(originalPrice);
  const discount = roundPercent(discountPercentage);

  if (!original || original <= 0) return 0;
  if (!discount || discount <= 0) return original;
  if (discount >= 100) return 0;

  return roundMoney(original * (1 - discount / 100));
};

export const calculateDiscount = (original, offer) => {
  const originalPrice = roundMoney(original);
  const offerPrice = roundMoney(offer);
  if (!originalPrice || originalPrice <= 0) return 0;
  return roundPercent(((originalPrice - offerPrice) / originalPrice) * 100);
};

export function resolveProductPricing({ original_price, discount_percentage, offer_price }) {
  const hasOriginal = original_price != null && original_price !== '';
  const hasDiscount = discount_percentage != null && discount_percentage !== '';

  if (hasOriginal && hasDiscount) {
    const original = roundMoney(original_price);
    const discount = roundPercent(discount_percentage);

    if (original < 0) return { error: 'Invalid original price' };
    if (discount < 0 || discount > 100) return { error: 'Discount must be between 0 and 100' };

    return {
      original_price: original,
      discount_percentage: discount,
      offer_price: calculateOfferPrice(original, discount),
    };
  }

  if (hasOriginal && offer_price != null && offer_price !== '') {
    const original = roundMoney(original_price);
    const offer = roundMoney(offer_price);

    if (original < 0 || offer < 0) return { error: 'Invalid price' };

    return {
      original_price: original,
      offer_price: offer,
      discount_percentage: calculateDiscount(original, offer),
    };
  }

  return null;
};
