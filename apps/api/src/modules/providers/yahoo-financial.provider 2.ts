import { Injectable, Logger } from "@nestjs/common";
import type {
  AccountingStandard,
  CompanyFinancials,
  FiscalPoint,
  Region,
  ScoringTemplate
} from "@intrinsic/shared";
import type { FinancialDataProvider, PricePoint } from "./provider.interface";

interface YahooRawNumber {
  raw?: number;
}

interface YahooStatementBase {
  endDate?: YahooRawNumber;
}

interface YahooIncomeStatement extends YahooStatementBase {
  totalRevenue?: YahooRawNumber;
  grossProfit?: YahooRawNumber;
  operatingIncome?: YahooRawNumber;
  netIncome?: YahooRawNumber;
  interestExpense?: YahooRawNumber;
}

interface YahooBalanceStatement extends YahooStatementBase {
  totalDebt?: YahooRawNumber;
  totalStockholderEquity?: YahooRawNumber;
  totalAssets?: YahooRawNumber;
  totalCurrentAssets?: YahooRawNumber;
  totalCurrentLiabilities?: YahooRawNumber;
  commonStockSharesOutstanding?: YahooRawNumber;
}

interface YahooCashflowStatement extends YahooStatementBase {
  totalCashFromOperatingActivities?: YahooRawNumber;
  capitalExpenditures?: YahooRawNumber;
}

interface YahooQuoteSummaryResult {
  incomeStatementHistory?: {
    incomeStatementHistory?: YahooIncomeStatement[];
  };
  balanceSheetHistory?: {
    balanceSheetStatements?: YahooBalanceStatement[];
  };
  cashflowStatementHistory?: {
    cashflowStatements?: YahooCashflowStatement[];
  };
}

interface YahooQuoteSummaryResponse {
  quoteSummary?: {
    result?: YahooQuoteSummaryResult[];
  };
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
}

const YAHOO_SUMMARY_URL = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";
const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

const currencyFromRegion = (region: Region): string => (region === "IN" ? "INR" : "USD");
const accountingFromSymbol = (symbol: string, region: Region): AccountingStandard => {
  const upper = symbol.toUpperCase();
  if (upper.endsWith(".NS") || upper.endsWith(".BO")) return "IND_AS";
  if (upper.includes(".")) return "IFRS";
  return region === "IN" ? "IND_AS" : "US_GAAP";
};

const asRaw = (value?: YahooRawNumber): number | undefined =>
  typeof value?.raw === "number" && Number.isFinite(value.raw) ? value.raw : undefined;

const yearFromEpoch = (epoch?: number): number | undefined => {
  if (!epoch || !Number.isFinite(epoch)) return undefined;
  return new Date(epoch * 1000).getUTCFullYear();
};

const templateFromTicker = (ticker: string): ScoringTemplate => {
  const normalized = ticker.toUpperCase();
  if (
    normalized.includes("BANK") ||
    normalized.includes("INS") ||
    normalized.includes("FIN")
  ) {
    return "FINANCIALS_V1";
  }
  return "OPERATING_COMPANY_V1";
};

const buildCandidates = (ticker: string, region: Region): string[] => {
  const clean = ticker.toUpperCase().trim();
  if (!clean) return [];
  if (region === "US") return [clean];
  if (clean.endsWith(".NS") || clean.endsWith(".BO")) return [clean];
  return [`${clean}.NS`, `${clean}.BO`, clean];
};

@Injectable()
export class YahooFinancialProvider implements FinancialDataProvider {
  private readonly logger = new Logger(YahooFinancialProvider.name);

  async getCompanyFinancials(params: {
    ticker: string;
    region: Region;
  }): Promise<CompanyFinancials> {
    const candidates = buildCandidates(params.ticker, params.region);

    for (const symbol of candidates) {
      const financials = await this.fetchCompanyFinancials(symbol, params.region);
      if (financials.points.length >= 4) return financials;
    }

    throw new Error(`Yahoo summary unavailable for ${params.ticker} (${params.region})`);
  }

  async getPriceHistory(params: {
    ticker: string;
    region: Region;
    years?: number;
  }): Promise<PricePoint[]> {
    const candidates = buildCandidates(params.ticker, params.region);
    const years = params.years ?? 10;

    for (const symbol of candidates) {
      const prices = await this.fetchPriceHistory(symbol, years);
      if (prices.length >= 12) return prices;
    }

    throw new Error(`Yahoo chart unavailable for ${params.ticker} (${params.region})`);
  }

  private async fetchCompanyFinancials(
    symbol: string,
    region: Region
  ): Promise<CompanyFinancials> {
    const modules = [
      "incomeStatementHistory",
      "balanceSheetHistory",
      "cashflowStatementHistory"
    ].join(",");

    const url = `${YAHOO_SUMMARY_URL}/${encodeURIComponent(symbol)}?modules=${modules}`;
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "Intrinsic/1.0"
      }
    });

    if (!response.ok) {
      this.logger.warn(`Yahoo summary ${symbol} failed with status ${response.status}`);
      return this.emptyFinancials(symbol, region);
    }

    const payload = (await response.json()) as YahooQuoteSummaryResponse;
    const result = payload.quoteSummary?.result?.[0];
    if (!result) return this.emptyFinancials(symbol, region);

    const byYear = new Map<number, FiscalPoint>();

    const ensurePoint = (year: number): FiscalPoint => {
      const existing = byYear.get(year);
      if (existing) return existing;
      const point: FiscalPoint = { year };
      byYear.set(year, point);
      return point;
    };

    for (const item of result.incomeStatementHistory?.incomeStatementHistory ?? []) {
      const year = yearFromEpoch(item.endDate?.raw);
      if (!year) continue;
      const point = ensurePoint(year);
      point.revenue = asRaw(item.totalRevenue);
      point.grossProfit = asRaw(item.grossProfit);
      point.operatingIncome = asRaw(item.operatingIncome);
      point.netIncome = asRaw(item.netIncome);
      point.interestExpense = asRaw(item.interestExpense);
    }

    for (const item of result.balanceSheetHistory?.balanceSheetStatements ?? []) {
      const year = yearFromEpoch(item.endDate?.raw);
      if (!year) continue;
      const point = ensurePoint(year);
      point.totalDebt = asRaw(item.totalDebt);
      point.totalEquity = asRaw(item.totalStockholderEquity);
      point.totalAssets = asRaw(item.totalAssets);
      point.currentAssets = asRaw(item.totalCurrentAssets);
      point.currentLiabilities = asRaw(item.totalCurrentLiabilities);
      point.sharesOutstanding = asRaw(item.commonStockSharesOutstanding);
    }

    for (const item of result.cashflowStatementHistory?.cashflowStatements ?? []) {
      const year = yearFromEpoch(item.endDate?.raw);
      if (!year) continue;
      const point = ensurePoint(year);
      point.operatingCashFlow = asRaw(item.totalCashFromOperatingActivities);
      const capexRaw = asRaw(item.capitalExpenditures);
      point.capex = typeof capexRaw === "number" ? Math.abs(capexRaw) : undefined;
    }

    const points = Array.from(byYear.values())
      .sort((a, b) => a.year - b.year)
      .slice(-10);

    for (const point of points) {
      if (
        typeof point.netIncome === "number" &&
        typeof point.totalEquity === "number" &&
        point.totalEquity > 0
      ) {
        point.roe = point.netIncome / point.totalEquity;
      }

      if (
        typeof point.operatingIncome === "number" &&
        typeof point.totalDebt === "number" &&
        typeof point.totalEquity === "number"
      ) {
        const investedCapital = point.totalDebt + point.totalEquity;
        if (investedCapital > 0) {
          point.roic = point.operatingIncome / investedCapital;
        }
      }
    }

    return {
      ticker: paramsTickerFromSymbol(symbol),
      region,
      accountingStandard: accountingFromSymbol(symbol, region),
      template: templateFromTicker(symbol),
      points,
      currency: currencyFromRegion(region),
      updatedAt: new Date().toISOString()
    };
  }

  private async fetchPriceHistory(symbol: string, years: number): Promise<PricePoint[]> {
    const range = `${Math.max(1, Math.min(20, years))}y`;
    const url = `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?interval=1mo&range=${range}`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "Intrinsic/1.0"
      }
    });

    if (!response.ok) {
      this.logger.warn(`Yahoo chart ${symbol} failed with status ${response.status}`);
      return [];
    }

    const payload = (await response.json()) as YahooChartResponse;
    const result = payload.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];

    const points: PricePoint[] = [];
    const size = Math.min(timestamps.length, closes.length);
    for (let idx = 0; idx < size; idx += 1) {
      const timestamp = timestamps[idx];
      const close = closes[idx];
      if (typeof timestamp !== "number" || typeof close !== "number" || !Number.isFinite(close)) {
        continue;
      }
      points.push({
        date: new Date(timestamp * 1000).toISOString(),
        close
      });
    }

    return points;
  }

  private emptyFinancials(symbol: string, region: Region): CompanyFinancials {
    return {
      ticker: paramsTickerFromSymbol(symbol),
      region,
      accountingStandard: accountingFromSymbol(symbol, region),
      template: templateFromTicker(symbol),
      points: [],
      currency: currencyFromRegion(region),
      updatedAt: new Date().toISOString()
    };
  }
}

const paramsTickerFromSymbol = (symbol: string): string =>
  symbol.toUpperCase().replace(/\.NS$|\.BO$/, "");
