import type { Region } from "../types/domain";

export interface RegionalPricing {
  month: number;
  year: number;
  currency: string;
  monthlyDisplay: string;
  yearlyDisplay: string;
}

export const PRICING_BY_REGION: Record<Region, RegionalPricing> = {
  US: {
    month: 12.99,
    year: 99,
    currency: "USD",
    monthlyDisplay: "$12.99/month",
    yearlyDisplay: "$99/year"
  },
  IN: {
    month: 399,
    year: 2999,
    currency: "INR",
    monthlyDisplay: "₹399/month",
    yearlyDisplay: "₹2,999/year"
  }
};
