import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

export const PLAN_PRICE_MAP: Record<string, string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID ?? "",
  team: process.env.STRIPE_TEAM_PRICE_ID ?? "",
};

export function priceToPlan(priceId: string): string {
  for (const [plan, id] of Object.entries(PLAN_PRICE_MAP)) {
    if (id === priceId) return plan;
  }
  return "free";
}
