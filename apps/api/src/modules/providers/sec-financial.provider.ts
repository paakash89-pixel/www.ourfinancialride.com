import type {
  CompanyFinancials,
  FiscalPoint,
  Region,
  ScoringTemplate
} from "@intrinsic/shared";
import type { FinancialDataProvider, PricePoint } from "./provider.interface";

interface SecTickerDirectory {
  fields?: string[];
  data?: Array<[number | string, string, string, string | null]>;
}

interface SecFactEntry {
  start?: string;
  end?: string;
  fy?: number | string;
  fp?: string;
  frame?: string;
  form?: string;
  filed?: string;
  val?: number;
}

interface SecTaxonomyConcept {
  units?: Record<string, SecFactEntry[]>;
}

interface SecCompanyFacts {
  facts?: Record<string, Record<string, SecTaxonomyConcept>>;
}

type TickerLookup = {
  cik10: string;
  ticker: string;
  name: string;
};

type YearValue = {
  value: number;
  score: number;
};

const SEC_TICKER_DIRECTORY_URL = "https://www.sec.gov/files/company_tickers_exchange.json";
const SEC_COMPANY_FACTS_BASE_URL = "https://data.sec.gov/api/xbrl/companyfacts/CIK";
const SEC_COMPANY_FACTS_SUFFIX = ".json";
const SEC_TIMEOUT_MS = 9_000;
const SEC_USER_AGENT =
  process.env.SEC_USER_AGENT?.trim() || "Intrinsic/1.0 (contact@intrinsic.app)";

const ANNUAL_FORMS = new Set(["10-K", "10-K/A", "20-F", "20-F/A", "40-F", "40-F/A"]);
const FORM_PRIORITY = new Map<string, number>([
  ["10-K", 60],
  ["10-K/A", 55],
  ["20-F", 50],
  ["20-F/A", 45],
  ["40-F", 40],
  ["40-F/A", 35]
]);

const TICKER_ALIASES: Record<string, string[]> = {
  GOOG: ["GOOGL"],
  BRKB: ["BRK-B", "BRK.B"]
};

const toNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const normalizeTicker = (value: string): string =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "");

const isAnnualForm = (value?: string): boolean => ANNUAL_FORMS.has((value ?? "").toUpperCase());

const toCik10 = (value: string | number): string =>
  String(value).replace(/\D/g, "").padStart(10, "0").slice(-10);

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

const yearFromFrame = (frame?: string): number | undefined => {
  if (!frame) return undefined;
  const normalized = frame.toUpperCase();
  const tagged = normalized.match(/(?:CY|FY)(\d{4})/);
  if (tagged) {
    const parsed = Number(tagged[1]);
    if (Number.isFinite(parsed)) return parsed;
  }

  const fallback = normalized.match(/(19|20)\d{2}/);
  if (fallback) {
    const parsed = Number(fallback[0]);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
};

const yearFromFact = (entry: SecFactEntry): number | undefined => {
  const frameYear = yearFromFrame(entry.frame);
  if (typeof frameYear === "number") return frameYear;

  if (entry.end) {
    const parsed = new Date(entry.end);
    const year = parsed.getUTCFullYear();
    if (Number.isFinite(year)) return year;
  }

  if (typeof entry.fy === "number" && Number.isFinite(entry.fy)) return entry.fy;
  if (typeof entry.fy === "string") {
    const parsed = Number(entry.fy);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
};

const periodDays = (entry: SecFactEntry): number | undefined => {
  if (!entry.start || !entry.end) return undefined;
  const start = new Date(entry.start).getTime();
  const end = new Date(entry.end).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;
  return (end - start) / (1000 * 60 * 60 * 24);
};

const annualScore = (entry: SecFactEntry): number => {
  const form = (entry.form ?? "").toUpperCase();
  const fp = (entry.fp ?? "").toUpperCase();
  const hasAnnualForm = isAnnualForm(form);
  const hasAnnualPeriod = fp === "FY";
  const days = periodDays(entry);
  const hasAnnualDuration = typeof days === "number" && days >= 300;

  // Reject short-period filings unless we have explicit annual markers.
  if (typeof days === "number" && days < 250 && !hasAnnualForm && !hasAnnualPeriod) {
    return -1;
  }

  // Require annual evidence from form, period marker, or duration.
  if (!hasAnnualForm && !hasAnnualPeriod && !hasAnnualDuration) return -1;

  let score = 0;
  score += hasAnnualForm ? 100 : 0;
  score += FORM_PRIORITY.get(form) ?? 0;
  score += hasAnnualDuration ? 35 : 0;
  score += fp === "FY" ? 20 : 0;
  if (typeof entry.fy === "number" || typeof entry.fy === "string") score += 8;
  if (entry.filed) {
    const filed = new Date(entry.filed).getTime();
    if (Number.isFinite(filed)) {
      score += Math.min(6, Math.max(0, Math.floor(filed / 86_400_000_000)));
    }
  }
  return score;
};

const extractAnnualSeries = (params: {
  facts: SecCompanyFacts["facts"];
  taxonomy: string;
  concepts: string[];
  units: string[];
  requireFpFy?: boolean;
  requireAnnualForm?: boolean;
}): Map<number, number> => {
  const byYear = new Map<number, YearValue>();
  const taxonomyFacts = params.facts?.[params.taxonomy] ?? {};

  for (const concept of params.concepts) {
    const conceptPayload = taxonomyFacts[concept];
    if (!conceptPayload?.units) continue;

    for (const unit of params.units) {
      const entries = conceptPayload.units[unit];
      if (!Array.isArray(entries)) continue;

      for (const entry of entries) {
        const value = toNumber(entry.val);
        if (value === undefined) continue;
        const year = yearFromFact(entry);
        if (!year || year < 1990 || year > 2100) continue;

        const score = annualScore(entry);
        if (score < 0) continue;
        if (params.requireFpFy) {
          if ((entry.fp ?? "").toUpperCase() !== "FY") continue;
          const frame = (entry.frame ?? "").toUpperCase();
          if (frame && /Q[1-4]/.test(frame)) continue;
        }
        if (params.requireAnnualForm && !isAnnualForm(entry.form)) continue;

        const existing = byYear.get(year);
        if (!existing || score > existing.score) {
          byYear.set(year, { value, score });
        }
      }
    }
  }

  const output = new Map<number, number>();
  for (const [year, payload] of byYear.entries()) {
    output.set(year, payload.value);
  }
  return output;
};

const absolute = (value: number | undefined): number | undefined =>
  typeof value === "number" ? Math.abs(value) : undefined;

const setIfFinite = (point: FiscalPoint, key: keyof FiscalPoint, value: number | undefined): void => {
  if (typeof value === "number" && Number.isFinite(value)) {
    (point[key] as number) = value;
  }
};

export class SecFinancialProvider implements FinancialDataProvider {
  private tickerIndexPromise: Promise<Map<string, TickerLookup>> | null = null;

  async getCompanyFinancials(params: {
    ticker: string;
    region: Region;
  }): Promise<CompanyFinancials> {
    if (params.region !== "US") {
      throw new Error(`SEC provider supports US only, received ${params.region}`);
    }

    const lookup = await this.resolveTicker(params.ticker);
    if (!lookup) {
      throw new Error(`SEC CIK not found for ticker ${params.ticker}`);
    }

    const facts = await this.fetchCompanyFacts(lookup.cik10);

    const revenue = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: [
        "Revenues",
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "RevenueFromContractWithCustomerIncludingAssessedTax",
        "SalesRevenueNet",
        "SalesRevenueGoodsNet"
      ],
      units: ["USD"],
      requireFpFy: true,
      requireAnnualForm: true
    });

    const grossProfit = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["GrossProfit"],
      units: ["USD"],
      requireFpFy: true,
      requireAnnualForm: true
    });

    const operatingIncome = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["OperatingIncomeLoss"],
      units: ["USD"],
      requireFpFy: true,
      requireAnnualForm: true
    });

    const netIncome = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["NetIncomeLoss", "ProfitLoss"],
      units: ["USD"],
      requireFpFy: true,
      requireAnnualForm: true
    });

    const operatingCashFlow = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["NetCashProvidedByUsedInOperatingActivities"],
      units: ["USD"],
      requireFpFy: true,
      requireAnnualForm: true
    });

    const capexRaw = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: [
        "PaymentsToAcquirePropertyPlantAndEquipment",
        "CapitalExpendituresIncurredButNotYetPaid"
      ],
      units: ["USD"],
      requireFpFy: true,
      requireAnnualForm: true
    });

    const totalDebtRaw = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["DebtAndFinanceLeaseLiabilities", "LongTermDebtAndCapitalLeaseObligations"],
      units: ["USD"],
      requireAnnualForm: true
    });

    const longDebtRaw = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["LongTermDebtAndFinanceLeaseObligations", "LongTermDebtNoncurrent"],
      units: ["USD"],
      requireAnnualForm: true
    });

    const shortDebtRaw = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["DebtCurrent", "ShortTermBorrowings"],
      units: ["USD"],
      requireAnnualForm: true
    });

    const totalEquity = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: [
        "StockholdersEquity",
        "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"
      ],
      units: ["USD"],
      requireAnnualForm: true
    });

    const totalAssets = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["Assets"],
      units: ["USD"],
      requireAnnualForm: true
    });

    const currentAssets = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["AssetsCurrent"],
      units: ["USD"],
      requireAnnualForm: true
    });

    const currentLiabilities = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["LiabilitiesCurrent"],
      units: ["USD"],
      requireAnnualForm: true
    });

    const interestExpenseRaw = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["InterestExpense"],
      units: ["USD"],
      requireFpFy: true,
      requireAnnualForm: true
    });

    const sharesOutstandingDei = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "dei",
      concepts: ["EntityCommonStockSharesOutstanding"],
      units: ["shares"],
      requireAnnualForm: true
    });

    const sharesOutstandingCommon = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["CommonStockSharesOutstanding"],
      units: ["shares"],
      requireAnnualForm: true
    });

    const weightedDilutedShares = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["WeightedAverageNumberOfDilutedSharesOutstanding"],
      units: ["shares"],
      requireFpFy: true,
      requireAnnualForm: true
    });

    const weightedBasicShares = extractAnnualSeries({
      facts: facts.facts,
      taxonomy: "us-gaap",
      concepts: ["WeightedAverageNumberOfSharesOutstandingBasic"],
      units: ["shares"],
      requireFpFy: true,
      requireAnnualForm: true
    });

    const years = new Set<number>();
    for (const series of [
      revenue,
      grossProfit,
      operatingIncome,
      netIncome,
      operatingCashFlow,
      capexRaw,
      totalDebtRaw,
      longDebtRaw,
      shortDebtRaw,
      totalEquity,
      totalAssets,
      currentAssets,
      currentLiabilities,
      interestExpenseRaw,
      sharesOutstandingDei,
      sharesOutstandingCommon,
      weightedDilutedShares,
      weightedBasicShares
    ]) {
      for (const year of series.keys()) years.add(year);
    }

    const points = Array.from(years)
      .sort((a, b) => a - b)
      .map((year): FiscalPoint => {
        const point: FiscalPoint = { year };

        const totalDebt =
          totalDebtRaw.get(year) ??
          (() => {
            const long = longDebtRaw.get(year);
            const short = shortDebtRaw.get(year);
            if (typeof long === "number" && typeof short === "number") return long + short;
            return long ?? short;
          })();

        setIfFinite(point, "revenue", revenue.get(year));
        setIfFinite(point, "grossProfit", grossProfit.get(year));
        setIfFinite(point, "operatingIncome", operatingIncome.get(year));
        setIfFinite(point, "netIncome", netIncome.get(year));
        setIfFinite(point, "operatingCashFlow", operatingCashFlow.get(year));
        setIfFinite(point, "capex", absolute(capexRaw.get(year)));
        setIfFinite(point, "totalDebt", absolute(totalDebt));
        setIfFinite(point, "totalEquity", totalEquity.get(year));
        setIfFinite(point, "totalAssets", totalAssets.get(year));
        setIfFinite(point, "currentAssets", currentAssets.get(year));
        setIfFinite(point, "currentLiabilities", currentLiabilities.get(year));
        setIfFinite(point, "interestExpense", absolute(interestExpenseRaw.get(year)));
        const sharesForYear =
          weightedDilutedShares.get(year) ??
          weightedBasicShares.get(year) ??
          sharesOutstandingCommon.get(year) ??
          sharesOutstandingDei.get(year);
        setIfFinite(point, "sharesOutstanding", sharesForYear);

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

        return point;
      })
      .filter(
        (point) =>
          typeof point.revenue === "number" ||
          typeof point.netIncome === "number" ||
          typeof point.operatingCashFlow === "number"
      )
      .slice(-12);

    const hasShares = points.some(
      (point) => typeof point.sharesOutstanding === "number" && point.sharesOutstanding > 0
    );
    if (!hasShares && points.length > 0) {
      const shareCandidates = [
        ...weightedDilutedShares.entries(),
        ...weightedBasicShares.entries(),
        ...sharesOutstandingCommon.entries(),
        ...sharesOutstandingDei.entries()
      ]
        .filter((entry) => Number.isFinite(entry[1]) && entry[1] > 0)
        .sort((a, b) => b[0] - a[0]);
      const fallbackShares = shareCandidates[0]?.[1];
      if (typeof fallbackShares === "number" && fallbackShares > 0) {
        points[points.length - 1].sharesOutstanding = fallbackShares;
      }
    }

    if (points.length < 4) {
      throw new Error(`SEC returned insufficient annual history for ${lookup.ticker}`);
    }

    return {
      ticker: lookup.ticker,
      region: "US",
      accountingStandard: "US_GAAP",
      template: templateFromTicker(lookup.ticker),
      points,
      currency: "USD",
      updatedAt: new Date().toISOString()
    };
  }

  async getPriceHistory(_params: {
    ticker: string;
    region: Region;
    years?: number;
  }): Promise<PricePoint[]> {
    throw new Error("SEC provider does not serve price history.");
  }

  private async resolveTicker(ticker: string): Promise<TickerLookup | undefined> {
    const index = await this.getTickerIndex();
    const raw = ticker.toUpperCase().trim();
    const normalized = normalizeTicker(raw);

    const candidates = [
      raw,
      raw.replace(/\./g, "-"),
      raw.replace(/-/g, "."),
      normalized,
      ...(TICKER_ALIASES[normalized] ?? [])
    ];

    for (const candidate of candidates) {
      const direct = index.get(candidate.toUpperCase());
      if (direct) return direct;
      const compactCandidate = index.get(normalizeTicker(candidate));
      if (compactCandidate) return compactCandidate;
    }

    return undefined;
  }

  private async getTickerIndex(): Promise<Map<string, TickerLookup>> {
    if (!this.tickerIndexPromise) {
      this.tickerIndexPromise = this.fetchTickerIndex();
    }
    return this.tickerIndexPromise;
  }

  private async fetchTickerIndex(): Promise<Map<string, TickerLookup>> {
    const payload = await this.fetchJson<SecTickerDirectory>(SEC_TICKER_DIRECTORY_URL);
    const rows = Array.isArray(payload.data) ? payload.data : [];

    const index = new Map<string, TickerLookup>();
    for (const row of rows) {
      const [cikRaw, nameRaw, tickerRaw] = row;
      const ticker = String(tickerRaw ?? "").toUpperCase().trim();
      if (!ticker) continue;

      const lookup: TickerLookup = {
        cik10: toCik10(cikRaw),
        ticker,
        name: String(nameRaw ?? ticker)
      };

      const keys = new Set<string>([
        ticker,
        ticker.replace(/\./g, "-"),
        ticker.replace(/-/g, "."),
        normalizeTicker(ticker)
      ]);

      for (const key of keys) {
        index.set(key, lookup);
      }
    }

    return index;
  }

  private async fetchCompanyFacts(cik10: string): Promise<SecCompanyFacts> {
    const url = `${SEC_COMPANY_FACTS_BASE_URL}${cik10}${SEC_COMPANY_FACTS_SUFFIX}`;
    return this.fetchJson<SecCompanyFacts>(url);
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEC_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "user-agent": SEC_USER_AGENT,
          accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`SEC request failed (${response.status}) for ${url}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
