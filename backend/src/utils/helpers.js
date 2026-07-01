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

export const calculateDiscount = (original, offer) => {
  if (!original || original <= 0) return 0;
  return Math.round(((original - offer) / original) * 100);
};
