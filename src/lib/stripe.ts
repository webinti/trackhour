import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
});

export const PRICE_IDS = {
  premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
  premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID!,
  business_monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID!,
  business_yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID!,
} as const;

export type PriceKey = keyof typeof PRICE_IDS;
