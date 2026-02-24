import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import type { CompanyFinancials, Region } from "@intrinsic/shared";
import { MockFinancialProvider } from "./mock.provider";
import type { DataSourceAttribution, PricePoint } from "./provider.interface";
import { CompanySearchProvider, type LiveCompanySearchResult } from "./company-search.provider";
import { YahooFinancialProvider } from "./yahoo-financial.provider";
import { FmpFinancialProvider } from "./fmp-financial.provider";
import { StooqPriceProvider } from "./stooq-price.provider";
import { SecFinancialProvider } from "./sec-financial.provider";

interface SourcePayload<T> {
  payload: T;
  source: DataSourceAttribution;
}

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);
  private readonly mockProvider = new MockFinancialProvider();
  private readonly yahooProvider = new YahooFinancialProvider();
  private readonly stooqPriceProvider = new StooqPriceProvider();
  private readonly secProvider = new SecFinancialProvider();
  private readonly fmpProvider = process.env.FMP_API_KEY
    ? new FmpFinancialProvider(process.env.FMP_API_KEY)
    : null;

  constructor(private readonly companySearchProvider: CompanySearchProvider) {}

  private get liveFinancialsEnabled(): boolean {
    return process.env.INTRINSIC_ENABLE_LIVE_FINANCIALS !== "false";
  }

  private get allowMockFallback(): boolean {
    return process.env.INTRINSIC_ALLOW_MOCK_FALLBACK === "true";
  }

  private get requireFilingGradeFinancials(): boolean {
    return process.env.INTRINSIC_REQUIRE_FILING_GRADE !== "false";
  }

  private sourceMeta(input: {
    id: DataSourceAttribution["id"];
    asOf?: string;
    notes?: string;
  }): DataSourceAttribution {
    if (input.id === "YAHOO_FINANCE") {
      return {
        id: "YAHOO_FINANCE",
        label: "Yahoo Finance API",
        type: "LIVE_API",
        verification:
          "https://query1.finance.yahoo.com/v8/finance/chart/{symbol} + Yahoo statement endpoints",
        asOf: input.asOf ?? new Date().toISOString(),
        notes: input.notes
      };
    }

    if (input.id === "DETERMINISTIC_ENGINE") {
      return {
        id: "DETERMINISTIC_ENGINE",
        label: "Intrinsic Deterministic Scoring Engine",
        type: "SIMULATED",
        verification: "packages/shared/src/scoring/engine.ts",
        asOf: input.asOf ?? new Date().toISOString(),
        notes: input.notes
      };
    }

    if (input.id === "FMP_FINANCIAL_MODELING_PREP") {
      return {
        id: "FMP_FINANCIAL_MODELING_PREP",
        label: "Financial Modeling Prep API",
        type: "LIVE_API",
        verification: "https://financialmodelingprep.com/developer/docs/",
        asOf: input.asOf ?? new Date().toISOString(),
        notes: input.notes
      };
    }

    if (input.id === "SEC_EDGAR_XBRL") {
      return {
        id: "SEC_EDGAR_XBRL",
        label: "SEC EDGAR XBRL Company Facts API",
        type: "LIVE_API",
        verification: "https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json",
        asOf: input.asOf ?? new Date().toISOString(),
        notes: input.notes
      };
    }

    if (input.id === "STOOQ_EOD") {
      return {
        id: "STOOQ_EOD",
        label: "Stooq End-of-Day CSV",
        type: "LIVE_API",
        verification: "https://stooq.com/q/d/l/?s={symbol}.us&i=d",
        asOf: input.asOf ?? new Date().toISOString(),
        notes: input.notes
      };
    }

    return {
      id: "MOCK_GENERATED",
      label: "Intrinsic Mock Financial Provider",
      type: "SIMULATED",
      verification: "apps/api/src/modules/providers/mock.provider.ts",
      asOf: input.asOf ?? new Date().toISOString(),
      notes: input.notes
    };
  }

  async getCompanyFinancialsWithSource(params: {
    ticker: string;
    region: Region;
  }): Promise<SourcePayload<CompanyFinancials>> {
    if (this.liveFinancialsEnabled) {
      const trySec = async (): Promise<SourcePayload<CompanyFinancials> | null> => {
        if (params.region !== "US") return null;
        try {
          const financials = await this.secProvider.getCompanyFinancials(params);
          if (financials.points.length >= 4) {
            return {
              payload: financials,
              source: this.sourceMeta({
                id: "SEC_EDGAR_XBRL",
                asOf: financials.updatedAt,
                notes:
                  "Filing-grade annual statements from SEC forms (10-K/20-F/40-F family) are used for scoring."
              })
            };
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          this.logger.warn(`SEC financials failed for ${params.ticker} (${params.region}): ${message}`);
        }
        return null;
      };

      const tryFmp = async (): Promise<SourcePayload<CompanyFinancials> | null> => {
        if (!this.fmpProvider) return null;
        try {
          const financials = await this.fmpProvider.getCompanyFinancials(params);
          if (financials.points.length >= 4) {
            return {
              payload: financials,
              source: this.sourceMeta({
                id: "FMP_FINANCIAL_MODELING_PREP",
                asOf: financials.updatedAt,
                notes:
                  params.region === "IN"
                    ? "Annual IND AS statements are sourced from India exchange-listed entities (.NS/.BO) as the filing-equivalent basis for scoring."
                    : "Annual filing-derived statements are used for scoring."
              })
            };
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          this.logger.warn(`FMP financials failed for ${params.ticker} (${params.region}): ${message}`);
        }
        return null;
      };

      const tryYahoo = async (): Promise<SourcePayload<CompanyFinancials> | null> => {
        try {
          const financials = await this.yahooProvider.getCompanyFinancials(params);
          if (financials.points.length >= 4) {
            return {
              payload: financials,
              source: this.sourceMeta({
                id: "YAHOO_FINANCE",
                asOf: financials.updatedAt
              })
            };
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          this.logger.warn(`Yahoo financials failed for ${params.ticker} (${params.region}): ${message}`);
        }
        return null;
      };

      if (this.requireFilingGradeFinancials) {
        if (params.region === "US") {
          const sec = await trySec();
          if (sec) return sec;
          const fmp = await tryFmp();
          if (fmp) return fmp;
        } else if (params.region === "IN") {
          const fmp = await tryFmp();
          if (fmp) return fmp;
        }

        if (!this.allowMockFallback) {
          throw new ServiceUnavailableException(
            `Filing-grade annual financial statements are unavailable for ${params.ticker} (${params.region}). ` +
              "Score generation is blocked to avoid non-filing inputs."
          );
        }
      } else {
        if (params.region === "US") {
          const sec = await trySec();
          if (sec) return sec;
        }
        const yahoo = await tryYahoo();
        if (yahoo) return yahoo;
        const fmp = await tryFmp();
        if (fmp) return fmp;
      }

      if (!this.allowMockFallback) {
        throw new ServiceUnavailableException(
          `Live financial statements are unavailable for ${params.ticker} (${params.region}). ` +
            "No score was generated to avoid simulated fallback data."
        );
      }
    }

    const financials = await this.mockProvider.getCompanyFinancials(params);
    return {
      payload: financials,
      source: this.sourceMeta({
        id: "MOCK_GENERATED",
        asOf: financials.updatedAt,
        notes: this.liveFinancialsEnabled
          ? "Live financial source unavailable for this ticker/region; fell back to simulated data."
          : "Live financial source disabled by configuration."
      })
    };
  }

  async getCompanyFinancials(params: {
    ticker: string;
    region: Region;
  }): Promise<CompanyFinancials> {
    const result = await this.getCompanyFinancialsWithSource(params);
    return result.payload;
  }

  async getPriceHistoryWithSource(params: {
    ticker: string;
    region: Region;
    years?: number;
  }): Promise<SourcePayload<PricePoint[]>> {
    if (this.liveFinancialsEnabled) {
      try {
        const prices = await this.yahooProvider.getPriceHistory(params);
        if (prices.length >= 12) {
          return {
            payload: prices,
            source: this.sourceMeta({
              id: "YAHOO_FINANCE",
              asOf: prices[prices.length - 1]?.date
            })
          };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        this.logger.warn(`Yahoo prices failed for ${params.ticker} (${params.region}): ${message}`);
      }

      if (this.fmpProvider) {
        try {
          const prices = await this.fmpProvider.getPriceHistory(params);
          if (prices.length >= 12) {
            return {
              payload: prices,
              source: this.sourceMeta({
                id: "FMP_FINANCIAL_MODELING_PREP",
                asOf: prices[prices.length - 1]?.date
              })
            };
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          this.logger.warn(`FMP prices failed for ${params.ticker} (${params.region}): ${message}`);
        }
      }

      try {
        const prices = await this.stooqPriceProvider.getPriceHistory(params);
        if (prices.length >= 24) {
          return {
            payload: prices,
            source: this.sourceMeta({
              id: "STOOQ_EOD",
              asOf: prices[prices.length - 1]?.date,
              notes:
                "Yahoo/FMP unavailable or limited. Used Stooq daily end-of-day prices for chart continuity."
            })
          };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        this.logger.warn(`Stooq prices failed for ${params.ticker} (${params.region}): ${message}`);
      }

      if (!this.allowMockFallback) {
        throw new ServiceUnavailableException(
          `Live price history is unavailable for ${params.ticker} (${params.region}). ` +
            "No simulated fallback data was used."
        );
      }
    }

    const prices = await this.mockProvider.getPriceHistory(params);
    return {
      payload: prices,
      source: this.sourceMeta({
        id: "MOCK_GENERATED",
        asOf: prices[prices.length - 1]?.date,
        notes: this.liveFinancialsEnabled
          ? "Live price source unavailable for this ticker/region; fell back to simulated data."
          : "Live price source disabled by configuration."
      })
    };
  }

  async getPriceHistory(params: {
    ticker: string;
    region: Region;
    years?: number;
  }): Promise<PricePoint[]> {
    const result = await this.getPriceHistoryWithSource(params);
    return result.payload;
  }

  searchCompaniesLive(params: {
    query: string;
    region: Region;
    limit?: number;
  }): Promise<LiveCompanySearchResult[]> {
    return this.companySearchProvider.search(params);
  }
}
