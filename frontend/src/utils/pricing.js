export function roundMoney(value) {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}

export function roundPercent(value) {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}

export function calculateOfferPrice(originalPrice, discountPercentage) {
  const original = roundMoney(originalPrice);
  const discount = roundPercent(discountPercentage);

  if (!original || original <= 0) return 0;
  if (!discount || discount <= 0) return original;
  if (discount >= 100) return 0;

  return roundMoney(original * (1 - discount / 100));
}

export function calculateDiscountPercentage(originalPrice, offerPrice) {
  const original = roundMoney(originalPrice);
  const offer = roundMoney(offerPrice);

  if (!original || original <= 0) return 0;
  return roundPercent(((original - offer) / original) * 100);
}

export function formatPercent(value) {
  const num = roundPercent(value);
  return Number.isInteger(num) ? `${num}` : num.toFixed(2).replace(/\.?0+$/, '');
}
