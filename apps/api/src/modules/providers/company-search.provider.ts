import { Injectable, Logger } from "@nestjs/common";
import type { Region } from "@intrinsic/shared";

export interface LiveCompanySearchResult {
  ticker: string;
  name: string;
  region: Region;
}

interface YahooQuote {
  symbol?: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
}

const YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search";

const US_EXCHANGES = new Set([
  "NMS",
  "NGM",
  "NCM",
  "NYQ",
  "ASE",
  "PCX",
  "BTS",
  "PNK",
  "NASDAQ",
  "NYSE"
]);

const IN_EXCHANGES = new Set(["NSI", "BSE", "NSE"]);

const normalizeTicker = (symbol: string, region: Region): string => {
  const upper = symbol.trim().toUpperCase();
  if (region === "IN") {
    return upper.replace(/\.NS$/, "").replace(/\.BO$/, "");
  }
  return upper;
};

const isTickerValid = (ticker: string): boolean => /^[A-Z0-9.-]{1,20}$/.test(ticker);

@Injectable()
export class CompanySearchProvider {
  private readonly logger = new Logger(CompanySearchProvider.name);

  async search(params: {
    query: string;
    region: Region;
    limit?: number;
  }): Promise<LiveCompanySearchResult[]> {
    if (process.env.INTRINSIC_ENABLE_LIVE_SEARCH === "false") {
      return [];
    }

    const query = params.query.trim();
    if (!query) return [];

    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 3500);

    try {
      const url = `${YAHOO_SEARCH_URL}?q=${encodeURIComponent(query)}&quotesCount=60&newsCount=0`;
      const response = await fetch(url, {
        signal: abort.signal,
        headers: {
          "user-agent": "Intrinsic/1.0",
          accept: "application/json"
        }
      });

      if (!response.ok) {
        this.logger.warn(`Live search failed with status ${response.status}`);
        return [];
      }

      const payload = (await response.json()) as { quotes?: YahooQuote[] };
      const quotes = payload.quotes ?? [];

      const filtered = quotes
        .filter((quote) => {
          const exchange = (quote.exchange ?? "").toUpperCase();
          const quoteType = (quote.quoteType ?? "").toUpperCase();
          if (quoteType !== "EQUITY") return false;

          if (params.region === "US") return US_EXCHANGES.has(exchange);
          return IN_EXCHANGES.has(exchange);
        })
        .map((quote) => {
          const symbol = quote.symbol ?? "";
          const ticker = normalizeTicker(symbol, params.region);
          const name = quote.shortname ?? quote.longname ?? ticker;
          return {
            ticker,
            name,
            region: params.region
          } satisfies LiveCompanySearchResult;
        })
        .filter((entry) => isTickerValid(entry.ticker));

      const deduped = new Map<string, LiveCompanySearchResult>();
      for (const entry of filtered) {
        const key = `${entry.region}:${entry.ticker}`;
        if (!deduped.has(key)) deduped.set(key, entry);
      }

      return Array.from(deduped.values()).slice(0, params.limit ?? 80);
    } catch (error) {
      this.logger.warn("Live search unavailable, using local universe fallback.");
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}
