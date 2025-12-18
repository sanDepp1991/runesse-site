export type PricingInput = {
  checkoutPrice: number;
  offerPercent: number;         // e.g. 25 = 25%
  futureBenefitPercent?: number; // e.g. cashback after 90 days
  runesseCommissionPercent: number; // e.g. 10% of total benefit
};

export type PricingResult = {
  cardholderPayNow: number;
  totalBenefit: number;
  buyerImmediateBenefit: number;
  buyerFutureBenefit: number;
  runesseCommission: number;
  cardholderShare: number;
  buyerNetSaving: number;
  suggestedBuyerDeposit: number;
};

export function calculatePricing(input: PricingInput): PricingResult {
  const {
    checkoutPrice,
    offerPercent,
    futureBenefitPercent = 0,
    runesseCommissionPercent,
  } = input;

  // Raw benefits
  const buyerImmediateBenefit = (checkoutPrice * offerPercent) / 100;
  const buyerFutureBenefit = (checkoutPrice * futureBenefitPercent) / 100;
  const totalBenefit = buyerImmediateBenefit + buyerFutureBenefit;

  // Commission
  const runesseCommission = (totalBenefit * runesseCommissionPercent) / 100;
  const cardholderShare = runesseCommission / 2; // 50–50 split
  const buyerNetSaving = totalBenefit - runesseCommission;

  // For now: cardholder pays full checkout price
  const cardholderPayNow = checkoutPrice;

  // Buyer deposit formula (Phase-1 simple version)
  const suggestedBuyerDeposit = cardholderPayNow + runesseCommission;

  return {
    cardholderPayNow,
    totalBenefit,
    buyerImmediateBenefit,
    buyerFutureBenefit,
    runesseCommission,
    cardholderShare,
    buyerNetSaving,
    suggestedBuyerDeposit,
  };
}
