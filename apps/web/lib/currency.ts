import type { Region } from "./region";

export const USD_INR_RATE = 83;

export const currencyCodeByRegion: Record<Region, "INR" | "USD"> = {
  IN: "INR",
  US: "USD"
};

export const localeByRegion: Record<Region, string> = {
  IN: "en-IN",
  US: "en-US"
};

export type MoneyFormatter = {
  format: (value: number) => string;
};

const currencySymbolByRegion: Record<Region, string> = {
  IN: "₹",
  US: "$"
};

const usNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

const usCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const formatIndianDigitsCroreStyle = (digits: string): string => {
  if (digits.length <= 3) return digits;

  const unit = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const parts: string[] = [];

  if (rest.length > 0) {
    const thousand = rest.slice(-2);
    rest = rest.slice(0, -2);
    if (rest.length > 0) {
      const lakh = rest.slice(-2);
      rest = rest.slice(0, -2);
      if (rest.length > 0) {
        // Keep all remaining digits in one chunk so large values stay in crore-style grouping.
        parts.push(rest);
      }
      parts.push(lakh);
    }
    parts.push(thousand);
  }

  parts.push(unit);
  return parts.join(",");
};

export const formatNumberByRegion = (value: number, region: Region): string => {
  if (!Number.isFinite(value)) return "0";
  const sign = value < 0 ? "-" : "";
  const rounded = Math.round(Math.abs(value));

  if (region === "US") {
    return `${sign}${usNumberFormatter.format(rounded)}`;
  }

  return `${sign}${formatIndianDigitsCroreStyle(String(rounded))}`;
};

const formatterByRegion: Record<Region, MoneyFormatter> = {
  IN: {
    format: (value: number) => {
      if (!Number.isFinite(value)) return "₹0";
      const sign = value < 0 ? "-" : "";
      const grouped = formatNumberByRegion(Math.abs(value), "IN");
      return `${sign}₹${grouped}`;
    }
  },
  US: usCurrencyFormatter
};

export const getCurrencyFormatter = (region: Region): MoneyFormatter =>
  formatterByRegion[region];

export const formatCompactMoney = (value: number, region: Region): string => {
  if (!Number.isFinite(value)) return `${currencySymbolByRegion[region]}0`;

  return getCurrencyFormatter(region).format(value);
};

export const convertAmount = (
  value: number,
  from: Region,
  to: Region
): number => {
  if (!Number.isFinite(value)) return 0;
  if (from === to) return value;
  if (from === "IN" && to === "US") return value / USD_INR_RATE;
  return value * USD_INR_RATE;
};

export const roundMoney = (value: number): number =>
  Math.round(value * 100) / 100;
