import { Injectable } from "@nestjs/common";
import type { Region } from "@intrinsic/shared";
import {
  STRESS_CONFIG_BY_REGION,
  detectStress,
  detectStressPeriods
} from "@intrinsic/shared";
import { PrismaService } from "../../common/prisma.service";
import { devStore } from "../../common/dev-store";
import { ProvidersService } from "../providers/providers.service";

const STRESS_PROXY_TICKER: Record<Region, string> = {
  US: "SPY",
  IN: "NIFTYBEES"
};

export interface StressStatus {
  region: Region;
  proxyTicker: string;
  evaluatedAt: string;
  stressModeActive: boolean;
  drawdownPct: number;
  peakDate: string | null;
  activePeriod: {
    startDate: string;
    endDate: string | null;
    peak: number;
    peakDate: string;
    trough: number;
    troughDate: string;
    drawdownPct: number;
  } | null;
  latestPeriod: {
    startDate: string;
    endDate: string | null;
    peak: number;
    peakDate: string;
    trough: number;
    troughDate: string;
    drawdownPct: number;
  } | null;
  periods: Array<{
    startDate: string;
    endDate: string | null;
    peak: number;
    peakDate: string;
    trough: number;
    troughDate: string;
    drawdownPct: number;
  }>;
}

export interface CommunityDisciplineSnapshot {
  asOf: string;
  investorsSampled: number;
  investorsStayedCalm: number;
  heldEvents: number;
  panicEvents: number;
  holdRatePct: number;
  simulatedRegretCostTotal: number;
  estimatedRegretAvoidedByCalmInvestors: number;
  note: string;
}

const toDate = (value: string): Date => new Date(value);
const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

@Injectable()
export class MarketService {
  constructor(
    private readonly providers: ProvidersService,
    private readonly prisma: PrismaService
  ) {}

  async getStressStatus(region: Region): Promise<StressStatus> {
    const proxyTicker = STRESS_PROXY_TICKER[region];
    const { payload: prices } = await this.providers.getPriceHistoryWithSource({
      ticker: proxyTicker,
      region,
      years: 2
    });

    const normalized = prices.map((point) => ({
      date: point.date,
      close: point.close
    }));

    const config = STRESS_CONFIG_BY_REGION[region];
    const periodsRaw = detectStressPeriods(normalized, config);
    const current = detectStress(normalized, config);

    if (!this.prisma.isConnected()) {
      const now = new Date();
      for (const period of periodsRaw) {
        const existing = devStore.stressPeriods.find(
          (entry) =>
            entry.region === region &&
            entry.startDate.toISOString() === period.startDate
        );
        if (existing) {
          existing.endDate = period.endDate ? toDate(period.endDate) : undefined;
          existing.peak = period.peak;
          existing.trough = period.trough;
          existing.drawdownPct = period.drawdownPct;
          existing.updatedAt = now;
          continue;
        }

        devStore.stressPeriods.push({
          id: devStore.makeId("stress"),
          region,
          startDate: toDate(period.startDate),
          endDate: period.endDate ? toDate(period.endDate) : undefined,
          peak: period.peak,
          trough: period.trough,
          drawdownPct: period.drawdownPct,
          createdAt: now,
          updatedAt: now
        });
      }

      devStore.stressStatuses.set(region, {
        region,
        stressModeActive: current.stressModeActive,
        drawdownPct: current.currentDrawdownPct,
        peakDate: current.peakDate ? new Date(current.peakDate) : undefined,
        activeStartDate: current.activePeriod?.startDate
          ? new Date(current.activePeriod.startDate)
          : undefined,
        refreshedAt: new Date()
      });
    } else {
      for (const period of periodsRaw) {
        await this.prisma.stressPeriod.upsert({
          where: {
            region_startDate: {
              region,
              startDate: toDate(period.startDate)
            }
          },
          create: {
            region,
            startDate: toDate(period.startDate),
            endDate: period.endDate ? toDate(period.endDate) : null,
            peak: period.peak,
            trough: period.trough,
            drawdownPct: period.drawdownPct
          },
          update: {
            endDate: period.endDate ? toDate(period.endDate) : null,
            peak: period.peak,
            trough: period.trough,
            drawdownPct: period.drawdownPct
          }
        });
      }

      await this.prisma.marketStressStatus.upsert({
        where: { region },
        create: {
          region,
          stressModeActive: current.stressModeActive,
          drawdownPct: current.currentDrawdownPct,
          peakDate: current.peakDate ? new Date(current.peakDate) : null,
          activeStartDate: current.activePeriod?.startDate
            ? new Date(current.activePeriod.startDate)
            : null,
          refreshedAt: new Date()
        },
        update: {
          stressModeActive: current.stressModeActive,
          drawdownPct: current.currentDrawdownPct,
          peakDate: current.peakDate ? new Date(current.peakDate) : null,
          activeStartDate: current.activePeriod?.startDate
            ? new Date(current.activePeriod.startDate)
            : null,
          refreshedAt: new Date()
        }
      });
    }

    const periods = periodsRaw
      .map((period) => ({
        startDate: period.startDate,
        endDate: period.endDate,
        peak: period.peak,
        peakDate: period.peakDate,
        trough: period.trough,
        troughDate: period.troughDate,
        drawdownPct: period.drawdownPct
      }))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    const activePeriod =
      [...periods].reverse().find((period) => period.endDate === null) ?? null;
    const latestPeriod = periods.length ? periods[periods.length - 1] : null;

    return {
      region,
      proxyTicker,
      evaluatedAt: current.evaluatedAt ?? new Date().toISOString(),
      stressModeActive: current.stressModeActive,
      drawdownPct: current.currentDrawdownPct,
      peakDate: current.peakDate,
      activePeriod,
      latestPeriod,
      periods: periods.slice(-12)
    };
  }

  async getCommunitySnapshot(): Promise<CommunityDisciplineSnapshot> {
    let heldEvents = 0;
    let panicEvents = 0;
    let simulatedRegretCostTotal = 0;
    let investorsSampled = 0;
    let investorsStayedCalm = 0;

    if (!this.prisma.isConnected()) {
      const byUser = new Map<
        string,
        { held: number; panic: number }
      >();

      for (const event of devStore.behaviorEvents) {
        const current = byUser.get(event.userId) ?? { held: 0, panic: 0 };
        if (event.type === "HELD") {
          heldEvents += 1;
          current.held += 1;
        } else {
          panicEvents += 1;
          current.panic += 1;
        }
        byUser.set(event.userId, current);
      }

      investorsSampled = byUser.size;
      investorsStayedCalm = [...byUser.values()].filter(
        (item) => item.held > 0 && item.panic === 0
      ).length;

      for (const snapshot of devStore.regretSnapshots) {
        const regret =
          snapshot.regretCostAmount ??
          snapshot.regretCost12m ??
          snapshot.regretCost6m ??
          snapshot.regretCost3m ??
          0;
        if (regret > 0) simulatedRegretCostTotal += regret;
      }
    } else {
      const [events, regretRows] = await Promise.all([
        this.prisma.behaviorEvent.findMany({
          select: {
            userId: true,
            type: true
          }
        }),
        this.prisma.regretSnapshot.findMany({
          select: {
            regretCostAmount: true,
            regretCost12m: true,
            regretCost6m: true,
            regretCost3m: true
          }
        })
      ]);

      const byUser = new Map<
        string,
        { held: number; panic: number }
      >();
      for (const event of events) {
        const current = byUser.get(event.userId) ?? { held: 0, panic: 0 };
        if (event.type === "HELD") {
          heldEvents += 1;
          current.held += 1;
        } else {
          panicEvents += 1;
          current.panic += 1;
        }
        byUser.set(event.userId, current);
      }

      investorsSampled = byUser.size;
      investorsStayedCalm = [...byUser.values()].filter(
        (item) => item.held > 0 && item.panic === 0
      ).length;

      for (const row of regretRows) {
        const regret =
          row.regretCostAmount ??
          row.regretCost12m ??
          row.regretCost6m ??
          row.regretCost3m ??
          0;
        if (regret > 0) simulatedRegretCostTotal += regret;
      }
    }

    const totalEvents = heldEvents + panicEvents;
    const holdRatePct = totalEvents > 0 ? (heldEvents / totalEvents) * 100 : 0;
    const avgRegretPerPanic =
      panicEvents > 0 ? simulatedRegretCostTotal / panicEvents : 0;
    const estimatedRegretAvoidedByCalmInvestors =
      investorsStayedCalm * avgRegretPerPanic;

    return {
      asOf: new Date().toISOString(),
      investorsSampled,
      investorsStayedCalm,
      heldEvents,
      panicEvents,
      holdRatePct: round2(holdRatePct),
      simulatedRegretCostTotal: round2(simulatedRegretCostTotal),
      estimatedRegretAvoidedByCalmInvestors: round2(
        estimatedRegretAvoidedByCalmInvestors
      ),
      note:
        "Anonymized aggregate from logged behavior events. Regret values are educational estimates from simulated panic-sell outcomes."
    };
  }
}
