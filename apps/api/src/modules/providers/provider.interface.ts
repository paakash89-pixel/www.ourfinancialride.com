import type { CompanyFinancials, Region } from "@intrinsic/shared";

export interface PricePoint {
  date: string;
  close: number;
}

export interface DataSourceAttribution {
  id:
    | "YAHOO_FINANCE"
    | "SEC_EDGAR_XBRL"
    | "FMP_FINANCIAL_MODELING_PREP"
    | "STOOQ_EOD"
    | "MOCK_GENERATED"
    | "DETERMINISTIC_ENGINE";
  label: string;
  type: "LIVE_API" | "SIMULATED";
  verification: string;
  asOf: string;
  notes?: string;
}

export interface FinancialDataProvider {
  getCompanyFinancials(params: {
    ticker: string;
    region: Region;
  }): Promise<CompanyFinancials>;
  getPriceHistory(params: {
    ticker: string;
    region: Region;
    years?: number;
  }): Promise<PricePoint[]>;
}
