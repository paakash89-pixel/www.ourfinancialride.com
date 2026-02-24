import { Injectable, NotFoundException } from "@nestjs/common";
import {
  scoreOwnerQuality,
  scoreSimpleOwnerQuality,
  type Region
} from "@intrinsic/shared";
import type { AuthUser } from "../../common/current-user.decorator";
import { ProvidersService } from "../providers/providers.service";
import { MeService } from "../me/me.service";
import { EntitlementsService } from "../billing/entitlements.service";
import { COMPANY_UNIVERSE, type CompanyEntry } from "./company-universe";
import type { CompanyQueryDto } from "./dto/company-query.dto";
import type { DataSourceAttribution } from "../providers/provider.interface";

const sanitizeTicker = (raw: string): string =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "")
    .slice(0, 20);

const rankSearch = (item: { ticker: string; name: string }, query: string): number => {
  const ticker = item.ticker.toLowerCase();
  const name = item.name.toLowerCase();

  if (ticker === query) return 100;
  if (ticker.startsWith(query)) return 80;
  if (name.startsWith(query)) return 70;
  if (ticker.includes(query)) return 55;
  if (name.includes(query)) return 40;
  return 0;
};

const looksLikeTicker = (raw: string): boolean => {
  const value = raw.trim();
  if (!value) return false;
  if (value !== value.toUpperCase()) return false;
  return /^[A-Z0-9.-]{1,20}$/.test(value);
};

const dedupeCompanies = (items: CompanyEntry[]): CompanyEntry[] => {
  const seen = new Set<string>();
  const output: CompanyEntry[] = [];
  for (const item of items) {
    const key = `${item.region}:${item.ticker}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
};

const sourceMeta = (source: DataSourceAttribution): DataSourceAttribution => source;

@Injectable()
export class CompaniesService {
  constructor(
    private readonly providers: ProvidersService,
    private readonly meService: MeService,
    private readonly entitlements: EntitlementsService
  ) {}

  private async resolveRegion(user: AuthUser, region?: Region): Promise<Region> {
    if (region) return region;
    const profile = await this.meService.getOrCreateProfile(user);
    return (profile.region as Region) ?? "US";
  }

  async searchCompanies(query: CompanyQueryDto) {
    const q = query.q?.trim() ?? "";
    const region = (query.region ?? "US") as Region;

    const localUniverse = COMPANY_UNIVERSE.filter((item) => item.region === region);

    if (!q) return localUniverse.slice(0, 50);

    const queryLower = q.toLowerCase();

    const localMatches = localUniverse
      .filter(
        (item) =>
          item.ticker.toLowerCase().includes(queryLower) ||
          item.name.toLowerCase().includes(queryLower)
      )
      .map((item) => ({ item, score: rankSearch(item, queryLower) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);

    const liveMatches = await this.providers.searchCompaniesLive({
      query: q,
      region,
      limit: 50
    });

    const merged = dedupeCompanies([...liveMatches, ...localMatches]);

    if (!merged.length && looksLikeTicker(q)) {
      return [
        {
          ticker: q.toUpperCase(),
          name: q.toUpperCase(),
          region
        }
      ];
    }

    return merged.slice(0, 50);
  }

  async getCompanyFinancials(params: {
    user: AuthUser;
    ticker: string;
    region?: Region;
  }) {
    const region = await this.resolveRegion(params.user, params.region);
    const ticker = sanitizeTicker(params.ticker);

    const { payload: financials, source } = await this.providers.getCompanyFinancialsWithSource({
      ticker,
      region
    });

    if (!financials.points.length) {
      throw new NotFoundException("No financial history available for this ticker");
    }

    return {
      ticker,
      region,
      currency: financials.currency,
      accountingStandard: financials.accountingStandard,
      template: financials.template,
      yearsOfHistory: financials.points.length,
      points: financials.points,
      dataSources: [sourceMeta(source)]
    };
  }

  private computeOwnerScore(financials: Awaited<ReturnType<ProvidersService["getCompanyFinancials"]>>) {
    const ownerScore = scoreOwnerQuality(financials);
    const simple = scoreSimpleOwnerQuality(financials);

    return {
      ownerScore: ownerScore.ownerScore,
      verdict: ownerScore.verdict,
      confidence: ownerScore.confidence,
      yearsOfHistory: ownerScore.yearsOfHistory,
      contributors: ownerScore.contributors,
      drivers: ownerScore.drivers,
      positives: ownerScore.positives,
      negatives: ownerScore.negatives,
      template: ownerScore.template,
      asOf: ownerScore.asOf,
      ownerQualityBadge: simple.badge,
      explanation: simple.explanation,
      statusMessage:
        simple.badge === "INSUFFICIENT_HISTORY"
          ? "Insufficient history for scoring"
          : null
    };
  }

  async getCompanyScore(params: {
    user: AuthUser;
    ticker: string;
    region?: Region;
    scoreVersion?: string;
  }) {
    const region = await this.resolveRegion(params.user, params.region);
    const ticker = sanitizeTicker(params.ticker);

    await this.entitlements.ensureUsageAllowed({
      userId: params.user.uid,
      region,
      kind: "ANALYSIS"
    });

    const { payload: financials, source } = await this.providers.getCompanyFinancialsWithSource({
      ticker,
      region
    });

    const score = this.computeOwnerScore(financials);

    await this.entitlements.incrementUsage({
      userId: params.user.uid,
      kind: "ANALYSIS"
    });

    return {
      ticker,
      region,
      scoreVersion: params.scoreVersion ?? "owner_score_v1",
      currency: financials.currency,
      score,
      dataSources: [
        sourceMeta(source),
        {
          id: "DETERMINISTIC_ENGINE",
          label: "Intrinsic Deterministic Owner Score Engine",
          type: "SIMULATED",
          verification: "packages/shared/src/scoring/engine.ts",
          asOf: new Date().toISOString()
        } satisfies DataSourceAttribution
      ]
    };
  }
}
