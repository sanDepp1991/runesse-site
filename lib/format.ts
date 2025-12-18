// Shared number format helpers (INR)
const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const formatNumber = (x?: number | string | null) => {
  const n = typeof x === 'string' ? Number(x) : x;
  return typeof n === 'number' && !Number.isNaN(n) ? INR.format(n) : '';
};

export const formatCurrencyINR = (x?: number | string | null) => `₹${formatNumber(x)}`;
