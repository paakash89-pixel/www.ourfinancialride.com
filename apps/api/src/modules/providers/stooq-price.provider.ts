import type { Region } from "@intrinsic/shared";
import type { PricePoint } from "./provider.interface";

const STOOQ_DAILY_URL = "https://stooq.com/q/d/l/";

const parseCsvPrices = (csv: string): PricePoint[] => {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) return [];
  if (lines[0].toLowerCase() !== "date,open,high,low,close,volume") return [];

  const points: PricePoint[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const cols = lines[index].split(",");
    if (cols.length < 5) continue;
    const date = cols[0];
    const close = Number(cols[4]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(close) || close <= 0) {
      continue;
    }
    points.push({
      date: new Date(`${date}T00:00:00.000Z`).toISOString(),
      close
    });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
};

const applyLookback = (points: PricePoint[], years: number): PricePoint[] => {
  if (points.length < 2) return points;
  const end = new Date(points[points.length - 1].date);
  const cutoff = new Date(end);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
  const cutoffTime = cutoff.getTime();

  return points.filter((point) => new Date(point.date).getTime() >= cutoffTime);
};

const candidatesFor = (ticker: string, region: Region): string[] => {
  const clean = ticker.trim().toLowerCase();
  if (!clean) return [];
  if (region === "US") return [`${clean}.us`];
  return [];
};

export class StooqPriceProvider {
  async getPriceHistory(params: {
    ticker: string;
    region: Region;
    years?: number;
  }): Promise<PricePoint[]> {
    const years = Math.max(1, Math.min(params.years ?? 10, 30));
    const candidates = candidatesFor(params.ticker, params.region);

    for (const symbol of candidates) {
      const url = `${STOOQ_DAILY_URL}?s=${encodeURIComponent(symbol)}&i=d`;
      const response = await fetch(url, {
        headers: {
          accept: "text/plain",
          "user-agent": "Intrinsic/1.0"
        }
      });
      if (!response.ok) continue;

      const body = await response.text();
      if (body.toLowerCase().includes("no data")) continue;

      const parsed = parseCsvPrices(body);
      if (parsed.length < 24) continue;

      const filtered = applyLookback(parsed, years);
      if (filtered.length >= 24) return filtered;
      return parsed;
    }

    throw new Error(`Stooq price history unavailable for ${params.ticker} (${params.region})`);
  }
}

