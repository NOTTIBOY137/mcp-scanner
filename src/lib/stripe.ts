// Stripe has been removed — all features are now free.

export function getStripe(): never {
  throw new Error("Stripe is disabled. All features are free.");
}

export const PLAN_PRICE_MAP: Record<string, string> = {};

export function priceToPlan(_priceId: string): string {
  return "team";
}
