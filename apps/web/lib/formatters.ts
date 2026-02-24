export const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export const num = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 1
});

export const pct = (value: number): string => `${num.format(value)}%`;
