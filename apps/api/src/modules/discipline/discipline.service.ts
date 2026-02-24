import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  computeBestHoldStreakDays,
  computeDisciplineScore,
  computeRegretOutcomes,
  isCooldownComplete,
  scoreOwnerQuality,
  type DisciplineBehaviorEvent,
  type PortfolioCompanyForDiscipline,
  type Region
} from "@intrinsic/shared";
import { PrismaService } from "../../common/prisma.service";
import { devStore } from "../../common/dev-store";
import type { AuthUser } from "../../common/current-user.decorator";
import { MeService } from "../me/me.service";
import { ProvidersService } from "../providers/providers.service";
import { MarketService } from "../market/market.service";
import { LogEventDto } from "./dto/log-event.dto";

const DAY_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_SECONDS = 30;
const EVENTS_RATE_LIMIT_PER_MINUTE = 20;
const EVENT_RATE_WINDOW_MS = 60_000;

const rateBuckets = new Map<string, number[]>();

const sanitizeTicker = (raw: string): string =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "")
    .slice(0, 20);

const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const toIsoDate = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

const cleanText = (value: string): string => value.trim().replace(/\s+/g, " ");

const defaultNotional = (region: Region): number => (region === "IN" ? 800_000 : 10_000);

const toUtcWeekStart = (value = new Date()): Date => {
  const date = new Date(value);
  const day = date.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diffToMonday);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const sameWeekStart = (a: Date, b: Date): boolean =>
  toUtcWeekStart(a).toISOString() === toUtcWeekStart(b).toISOString();

interface EventWithOptionalRegret {
  id: string;
  ticker: string;
  region: string;
  type: "PANIC_SELL_SIMULATED" | "HELD";
  createdAt: Date;
  reasonText: string;
  stressModeActive: boolean;
  priceAtEvent: number;
  regretSnapshot?: {
    regret3mPct: number | null;
    regret6mPct: number | null;
    regret12mPct: number | null;
    regretCost3m: number | null;
    regretCost6m: number | null;
    regretCost12m: number | null;
    regretCostAmount: number | null;
  } | null;
}

@Injectable()
export class DisciplineService {
  private readonly logger = new Logger(DisciplineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meService: MeService,
    private readonly providers: ProvidersService,
    private readonly marketService: MarketService
  ) {}

  private enforceRateLimit(userId: string): void {
    const now = Date.now();
    const current = rateBuckets.get(userId) ?? [];
    const fresh = current.filter((stamp) => now - stamp < EVENT_RATE_WINDOW_MS);
    if (fresh.length >= EVENTS_RATE_LIMIT_PER_MINUTE) {
      throw new HttpException(
        "Too many event requests. Try again shortly.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    fresh.push(now);
    rateBuckets.set(userId, fresh);
  }

  private async trackedItem(params: {
    userId: string;
    ticker: string;
    region: Region;
  }): Promise<{ createdAt: Date } | null> {
    if (!this.prisma.isConnected()) {
      const row = devStore.watchlistItems.find(
        (item) =>
          item.userId === params.userId &&
          item.ticker === params.ticker &&
          item.region === params.region
      );
      if (!row) return null;
      return { createdAt: row.createdAt };
    }

    const row = await this.prisma.watchlistItem.findFirst({
      where: {
        userId: params.userId,
        ticker: params.ticker,
        region: params.region
      },
      select: { createdAt: true }
    });

    return row;
  }

  private async requireTrackedTicker(params: {
    userId: string;
    ticker: string;
    region: Region;
  }): Promise<{ createdAt: Date }> {
    const tracked = await this.trackedItem(params);
    if (!tracked) {
      throw new BadRequestException("Track this company first before logging behavior.");
    }
    return tracked;
  }

  private async resolvePriceAtEvent(params: {
    ticker: string;
    region: Region;
    provided?: number;
  }): Promise<number> {
    if (
      typeof params.provided === "number" &&
      Number.isFinite(params.provided) &&
      params.provided > 0
    ) {
      return params.provided;
    }

    const prices = await this.providers.getPriceHistory({
      ticker: params.ticker,
      region: params.region,
      years: 1
    });

    const latest = [...prices]
      .filter((point) => Number.isFinite(point.close) && point.close > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .at(-1);

    if (!latest) {
      throw new BadRequestException("Price snapshot unavailable for event logging");
    }
    return latest.close;
  }

  private async startSellFlow(params: {
    userId: string;
    ticker: string;
    region: Region;
    trackedAt: Date;
  }) {
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + COOLDOWN_SECONDS * 1000);
    const trackedDays = Math.max(
      0,
      Math.floor((startedAt.getTime() - params.trackedAt.getTime()) / DAY_MS)
    );

    if (!this.prisma.isConnected()) {
      const session = {
        id: devStore.makeId("cooldown"),
        userId: params.userId,
        ticker: params.ticker,
        region: params.region,
        startedAt,
        expiresAt
      };
      devStore.sellFlowSessions.push(session);
      return {
        cooldownSessionId: session.id,
        startedAt: session.startedAt.toISOString(),
        cooldownEndsAt: session.expiresAt.toISOString(),
        cooldownSeconds: COOLDOWN_SECONDS,
        trackedDays
      };
    }

    const session = await this.prisma.sellFlowSession.create({
      data: {
        userId: params.userId,
        ticker: params.ticker,
        region: params.region,
        startedAt,
        expiresAt
      }
    });

    return {
      cooldownSessionId: session.id,
      startedAt: session.startedAt.toISOString(),
      cooldownEndsAt: session.expiresAt.toISOString(),
      cooldownSeconds: COOLDOWN_SECONDS,
      trackedDays
    };
  }

  private async assertAndConsumeCooldown(params: {
    userId: string;
    ticker: string;
    region: Region;
    cooldownSessionId?: string;
  }): Promise<void> {
    if (!params.cooldownSessionId) {
      throw new BadRequestException("Cooldown session is required");
    }

    const now = new Date();

    if (!this.prisma.isConnected()) {
      const session = devStore.sellFlowSessions.find(
        (entry) =>
          entry.id === params.cooldownSessionId &&
          entry.userId === params.userId &&
          entry.ticker === params.ticker &&
          entry.region === params.region
      );

      if (!session) throw new BadRequestException("Invalid cooldown session");
      if (session.usedAt) throw new BadRequestException("Cooldown session already used");
      if (
        !isCooldownComplete({
          startedAt: session.startedAt,
          now,
          cooldownSeconds: COOLDOWN_SECONDS
        })
      ) {
        throw new BadRequestException("Cooldown still active");
      }

      session.usedAt = now;
      return;
    }

    const session = await this.prisma.sellFlowSession.findUnique({
      where: { id: params.cooldownSessionId }
    });

    if (
      !session ||
      session.userId !== params.userId ||
      session.ticker !== params.ticker ||
      session.region !== params.region
    ) {
      throw new BadRequestException("Invalid cooldown session");
    }

    if (session.usedAt) throw new BadRequestException("Cooldown session already used");

    if (
      !isCooldownComplete({
        startedAt: session.startedAt,
        now,
        cooldownSeconds: COOLDOWN_SECONDS
      })
    ) {
      throw new BadRequestException("Cooldown still active");
    }

    await this.prisma.sellFlowSession.update({
      where: { id: session.id },
      data: { usedAt: now }
    });
  }

  private async findExistingEventByClientId(params: {
    userId: string;
    clientEventId?: string;
  }) {
    if (!params.clientEventId) return null;

    if (!this.prisma.isConnected()) {
      return (
        devStore.behaviorEvents.find(
          (entry) =>
            entry.userId === params.userId &&
            entry.clientEventId === params.clientEventId
        ) ?? null
      );
    }

    return this.prisma.behaviorEvent.findFirst({
      where: {
        userId: params.userId,
        clientEventId: params.clientEventId
      },
      include: { regretSnapshot: true }
    });
  }

  private async readRegretForEvent(eventId: string) {
    if (!this.prisma.isConnected()) {
      return devStore.regretSnapshots.find((snapshot) => snapshot.eventId === eventId) ?? null;
    }

    return this.prisma.regretSnapshot.findUnique({
      where: { eventId }
    });
  }

  private buildEventResponse(params: {
    event: {
      id: string;
      type: "PANIC_SELL_SIMULATED" | "HELD";
      region: string;
      ticker: string;
      stressModeActive: boolean;
      priceAtEvent: number;
    };
    regretSnapshot?: {
      regret3mPct: number | null;
      regret6mPct: number | null;
      regret12mPct: number | null;
      regretCost3m: number | null;
      regretCost6m: number | null;
      regretCost12m: number | null;
      regretCostAmount: number | null;
    } | null;
    idempotent?: boolean;
  }) {
    return {
      ok: true as const,
      eventId: params.event.id,
      eventType: params.event.type,
      region: params.event.region,
      ticker: params.event.ticker,
      stressModeActive: params.event.stressModeActive,
      priceAtEvent: round2(params.event.priceAtEvent),
      calmWarning:
        params.event.type === "PANIC_SELL_SIMULATED"
          ? "This looks emotion-driven. Consider pausing and reviewing fundamentals again."
          : null,
      regretPreview: params.regretSnapshot
        ? {
            regret3mPct: params.regretSnapshot.regret3mPct,
            regret6mPct: params.regretSnapshot.regret6mPct,
            regret12mPct: params.regretSnapshot.regret12mPct,
            regretCost3m: params.regretSnapshot.regretCost3m,
            regretCost6m: params.regretSnapshot.regretCost6m,
            regretCost12m: params.regretSnapshot.regretCost12m,
            regretCostAmount: params.regretSnapshot.regretCostAmount
          }
        : null,
      idempotent: Boolean(params.idempotent)
    };
  }

  private currentHoldStreakDays(
    events: Array<{ type: string; createdAt: Date }>,
    asOf: Date
  ): number {
    const panic = events
      .filter((event) => event.type === "PANIC_SELL_SIMULATED")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (!panic) {
      const first = events
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .at(0);
      if (!first) return 0;
      return Math.max(0, Math.floor((asOf.getTime() - first.createdAt.getTime()) / DAY_MS));
    }

    return Math.max(0, Math.floor((asOf.getTime() - panic.createdAt.getTime()) / DAY_MS));
  }

  private async loadEventsForUser(userId: string): Promise<EventWithOptionalRegret[]> {
    if (!this.prisma.isConnected()) {
      return devStore.behaviorEvents
        .filter((entry) => entry.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((event) => ({
          ...event,
          regretSnapshot:
            devStore.regretSnapshots.find((snapshot) => snapshot.eventId === event.id) ?? null
        }));
    }

    return this.prisma.behaviorEvent.findMany({
      where: { userId },
      include: { regretSnapshot: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async logEvent(params: {
    user: AuthUser;
    payload: LogEventDto;
  }) {
    this.enforceRateLimit(params.user.uid);

    const profile = await this.meService.getOrCreateProfile(params.user);
    const region = (params.payload.region ?? profile.region) as Region;
    const ticker = sanitizeTicker(params.payload.ticker);

    if (!ticker) {
      throw new BadRequestException("Ticker is required");
    }

    const tracked = await this.requireTrackedTicker({
      userId: params.user.uid,
      ticker,
      region
    });

    if (params.payload.action === "START") {
      return this.startSellFlow({
        userId: params.user.uid,
        ticker,
        region,
        trackedAt: tracked.createdAt
      });
    }

    const reasonText = params.payload.reasonText ? cleanText(params.payload.reasonText) : "";

    if (!params.payload.type || !reasonText) {
      throw new BadRequestException("Event type and reason are required");
    }

    if (reasonText.length < 10) {
      throw new BadRequestException("reasonText must be at least 10 characters");
    }

    const existing = await this.findExistingEventByClientId({
      userId: params.user.uid,
      clientEventId: params.payload.clientEventId
    });

    if (existing) {
      const regretSnapshot = (
        "regretSnapshot" in existing
          ? existing.regretSnapshot
          : await this.readRegretForEvent(existing.id)
      ) as {
        regret3mPct: number | null;
        regret6mPct: number | null;
        regret12mPct: number | null;
        regretCost3m: number | null;
        regretCost6m: number | null;
        regretCost12m: number | null;
        regretCostAmount: number | null;
      } | null;

      return this.buildEventResponse({
        event: {
          id: existing.id,
          type: existing.type,
          region: existing.region,
          ticker: existing.ticker,
          stressModeActive: existing.stressModeActive,
          priceAtEvent: existing.priceAtEvent
        },
        regretSnapshot,
        idempotent: true
      });
    }

    await this.assertAndConsumeCooldown({
      userId: params.user.uid,
      ticker,
      region,
      cooldownSessionId: params.payload.cooldownSessionId
    });

    const [priceAtEvent, stressStatus] = await Promise.all([
      this.resolvePriceAtEvent({
        ticker,
        region,
        provided: params.payload.priceAtEvent
      }),
      this.marketService.getStressStatus(region)
    ]);

    const eventTimestamp = toIsoDate(params.payload.timestampOverride) ?? new Date().toISOString();
    const notional =
      typeof params.payload.notional === "number" && Number.isFinite(params.payload.notional)
        ? params.payload.notional
        : defaultNotional(region);

    let eventId = "";
    const eventType = params.payload.type;

    if (!this.prisma.isConnected()) {
      const event = {
        id: devStore.makeId("event"),
        userId: params.user.uid,
        ticker,
        region,
        type: eventType,
        clientEventId: params.payload.clientEventId,
        reasonText,
        breakConditionsMet: false,
        breakConditionTriggered: false,
        breakConditionMatches: [],
        stressModeActive: stressStatus.stressModeActive,
        priceAtEvent,
        notional,
        createdAt: new Date(eventTimestamp)
      };
      devStore.behaviorEvents.push(event);
      eventId = event.id;
    } else {
      const event = await this.prisma.behaviorEvent.create({
        data: {
          userId: params.user.uid,
          ticker,
          region,
          type: eventType,
          clientEventId: params.payload.clientEventId,
          reasonText,
          breakConditionsMet: false,
          breakConditionTriggered: false,
          breakConditionMatches: [],
          stressModeActive: stressStatus.stressModeActive,
          priceAtEvent,
          notional,
          createdAt: new Date(eventTimestamp)
        }
      });
      eventId = event.id;
    }

    let regretPreview: {
      regret3mPct: number | null;
      regret6mPct: number | null;
      regret12mPct: number | null;
      regretCost3m: number | null;
      regretCost6m: number | null;
      regretCost12m: number | null;
      regretCostAmount: number | null;
    } | null = null;

    if (eventType === "PANIC_SELL_SIMULATED") {
      const prices = await this.providers.getPriceHistory({
        ticker,
        region,
        years: 10
      });

      const regret = computeRegretOutcomes({
        series: prices,
        eventDate: eventTimestamp,
        notional
      });

      const pick = (months: 3 | 6 | 12) =>
        regret?.results.find((item) => item.horizonMonths === months);
      const r3 = pick(3);
      const r6 = pick(6);
      const r12 = pick(12);
      const regretCostAmount = r12?.regretCost ?? r6?.regretCost ?? r3?.regretCost ?? null;

      regretPreview = {
        regret3mPct: r3?.regretPct ?? null,
        regret6mPct: r6?.regretPct ?? null,
        regret12mPct: r12?.regretPct ?? null,
        regretCost3m: r3?.regretCost ?? null,
        regretCost6m: r6?.regretCost ?? null,
        regretCost12m: r12?.regretCost ?? null,
        regretCostAmount
      };

      if (!this.prisma.isConnected()) {
        devStore.regretSnapshots.push({
          id: devStore.makeId("regret"),
          eventId,
          regret3mPct: regretPreview.regret3mPct ?? undefined,
          regret6mPct: regretPreview.regret6mPct ?? undefined,
          regret12mPct: regretPreview.regret12mPct ?? undefined,
          regretCost3m: regretPreview.regretCost3m ?? undefined,
          regretCost6m: regretPreview.regretCost6m ?? undefined,
          regretCost12m: regretPreview.regretCost12m ?? undefined,
          regretCostAmount: regretPreview.regretCostAmount ?? undefined,
          currency: profile.currency,
          createdAt: new Date()
        });
      } else {
        await this.prisma.regretSnapshot.create({
          data: {
            eventId,
            regret3mPct: regretPreview.regret3mPct,
            regret6mPct: regretPreview.regret6mPct,
            regret12mPct: regretPreview.regret12mPct,
            regretCost3m: regretPreview.regretCost3m,
            regretCost6m: regretPreview.regretCost6m,
            regretCost12m: regretPreview.regretCost12m,
            regretCostAmount: regretPreview.regretCostAmount,
            currency: profile.currency
          }
        });
      }
    }

    return this.buildEventResponse({
      event: {
        id: eventId,
        type: eventType,
        region,
        ticker,
        stressModeActive: stressStatus.stressModeActive,
        priceAtEvent
      },
      regretSnapshot: regretPreview,
      idempotent: false
    });
  }

  async getRegretLedger(user: AuthUser) {
    const profile = await this.meService.getOrCreateProfile(user);
    const now = new Date();
    const events = await this.loadEventsForUser(user.uid);

    const panicEvents = events.filter((event) => event.type === "PANIC_SELL_SIMULATED");

    const holdStreakDays = this.currentHoldStreakDays(events, now);
    const bestHoldStreakDays = computeBestHoldStreakDays(
      events.map((event) => ({
        type: event.type,
        timestamp: event.createdAt.toISOString()
      }))
    );

    const lifetimeRegretCostEstimate = round2(
      panicEvents.reduce((sum, event) => {
        const regret = event.regretSnapshot;
        if (!regret) return sum;
        return (
          sum +
          (regret.regretCostAmount ??
            regret.regretCost12m ??
            regret.regretCost6m ??
            regret.regretCost3m ??
            0)
        );
      }, 0)
    );

    return {
      currency: profile.currency,
      aggregates: {
        panicEventsCount: panicEvents.length,
        holdEventsCount: events.filter((event) => event.type === "HELD").length,
        lifetimeRegretCostEstimate,
        holdStreakDays,
        bestHoldStreakDays
      },
      entries: events.map((event) => ({
        id: event.id,
        ticker: event.ticker,
        region: event.region,
        eventType: event.type,
        timestamp: event.createdAt.toISOString(),
        reasonText: event.reasonText,
        stressModeActive: event.stressModeActive,
        priceAtEvent: event.priceAtEvent,
        regret3mPct: event.regretSnapshot?.regret3mPct ?? null,
        regret6mPct: event.regretSnapshot?.regret6mPct ?? null,
        regret12mPct: event.regretSnapshot?.regret12mPct ?? null,
        regretCost3m: event.regretSnapshot?.regretCost3m ?? null,
        regretCost6m: event.regretSnapshot?.regretCost6m ?? null,
        regretCost12m: event.regretSnapshot?.regretCost12m ?? null,
        regretCostAmount: event.regretSnapshot?.regretCostAmount ?? null
      }))
    };
  }

  async submitWeeklyReflection(params: {
    user: AuthUser;
    prompt: string;
    responseText: string;
  }) {
    const prompt = cleanText(params.prompt);
    const responseText = cleanText(params.responseText);

    if (prompt.length < 5 || responseText.length < 10) {
      throw new BadRequestException("Reflection prompt/response is too short");
    }

    const weekStart = toUtcWeekStart();

    if (!this.prisma.isConnected()) {
      const existing = devStore.weeklyReflections.find(
        (entry) =>
          entry.userId === params.user.uid &&
          sameWeekStart(entry.weekStartDate, weekStart)
      );

      if (existing) {
        existing.prompt = prompt;
        existing.responseText = responseText;
        return existing;
      }

      const created = {
        id: devStore.makeId("reflection"),
        userId: params.user.uid,
        weekStartDate: weekStart,
        prompt,
        responseText,
        createdAt: new Date()
      };

      devStore.weeklyReflections.push(created);
      return created;
    }

    return this.prisma.weeklyReflection.upsert({
      where: {
        userId_weekStartDate: {
          userId: params.user.uid,
          weekStartDate: weekStart
        }
      },
      create: {
        userId: params.user.uid,
        weekStartDate: weekStart,
        prompt,
        responseText
      },
      update: {
        prompt,
        responseText
      }
    });
  }

  async getDisciplineSummary(user: AuthUser) {
    const profile = await this.meService.getOrCreateProfile(user);
    const asOf = new Date();
    const asOfDay = new Date(asOf);
    asOfDay.setUTCHours(0, 0, 0, 0);

    const [stress, trackedRows, events, reflections, latestSnapshot] = await Promise.all([
      this.marketService.getStressStatus(profile.region as Region),
      !this.prisma.isConnected()
        ? Promise.resolve(
            devStore.watchlistItems
              .filter((entry) => entry.userId === user.uid)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          )
        : this.prisma.watchlistItem.findMany({
            where: { userId: user.uid },
            orderBy: { createdAt: "desc" }
          }),
      this.loadEventsForUser(user.uid),
      !this.prisma.isConnected()
        ? Promise.resolve(
            devStore.weeklyReflections
              .filter((entry) => entry.userId === user.uid)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          )
        : this.prisma.weeklyReflection.findMany({
            where: { userId: user.uid },
            orderBy: { createdAt: "desc" }
          }),
      !this.prisma.isConnected()
        ? Promise.resolve(
            devStore.disciplineSnapshots
              .filter((entry) => entry.userId === user.uid)
              .sort((a, b) => b.asOfDate.getTime() - a.asOfDate.getTime())[0] ?? null
          )
        : this.prisma.disciplineSnapshot.findFirst({
            where: { userId: user.uid },
            orderBy: { asOfDate: "desc" }
          })
    ]);

    const trackedUnique = new Map<string, { ticker: string; region: Region }>();
    for (const row of trackedRows) {
      trackedUnique.set(`${row.region}:${row.ticker}`, {
        ticker: row.ticker,
        region: row.region as Region
      });
    }

    const trackedCompanies = [...trackedUnique.values()];

    const scoredCompanies = await Promise.all(
      trackedCompanies.map(async (company) => {
        try {
          const financials = await this.providers.getCompanyFinancials({
            ticker: company.ticker,
            region: company.region
          });
          const score = scoreOwnerQuality(financials);
          return {
            ticker: company.ticker,
            ownerScore: score.ownerScore,
            confidence: score.confidence,
            sector: score.sectorProfile
          } as PortfolioCompanyForDiscipline;
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          this.logger.warn(
            `Skipping ${company.ticker} (${company.region}) for discipline score: ${message}`
          );
          return null;
        }
      })
    );

    const portfolioInputs = scoredCompanies.filter(
      (item): item is PortfolioCompanyForDiscipline => Boolean(item)
    );

    const reflectionLastAt = reflections[0]?.createdAt?.toISOString() ?? null;
    const recentReflection = reflections.find((item) => {
      const ageDays = Math.floor((asOf.getTime() - item.createdAt.getTime()) / DAY_MS);
      return ageDays <= 7;
    });

    const latestSnapshotTime = latestSnapshot ? latestSnapshot.asOfDate.getTime() : null;
    const panicEventSinceLastUpdate =
      latestSnapshotTime !== null
        ? events.some(
            (event) =>
              event.type === "PANIC_SELL_SIMULATED" &&
              event.createdAt.getTime() > latestSnapshotTime
          )
        : false;

    const eventInputs: DisciplineBehaviorEvent[] = events.map((event) => ({
      type: event.type,
      createdAt: event.createdAt.toISOString(),
      stressModeActive: event.stressModeActive
    }));

    const score = computeDisciplineScore({
      asOf: asOf.toISOString(),
      companies: portfolioInputs,
      events: eventInputs,
      weeklyCheckinLastAt: reflectionLastAt,
      fallbackMostlyOneStock:
        profile.concentrationLabel === "EXTREME" || profile.concentrationLabel === "FOCUSED",
      previousScore: latestSnapshot?.score ?? null,
      panicEventSinceLastUpdate
    });

    const holdStreakDays = this.currentHoldStreakDays(events, asOf);
    const bestHoldStreakDays = computeBestHoldStreakDays(
      events.map((event) => ({
        type: event.type,
        timestamp: event.createdAt.toISOString()
      }))
    );

    const stressEvents = events.filter((event) => event.stressModeActive);
    const stressPanics = stressEvents.filter(
      (event) => event.type === "PANIC_SELL_SIMULATED"
    ).length;
    const crashHoldRatePct =
      stressEvents.length > 0
        ? round2(((stressEvents.length - stressPanics) / stressEvents.length) * 100)
        : null;

    const dueWeeklyReflection = !recentReflection;

    if (score.score !== null) {
      if (!this.prisma.isConnected()) {
        const existing = devStore.disciplineSnapshots.find(
          (entry) =>
            entry.userId === user.uid &&
            entry.asOfDate.toISOString() === asOfDay.toISOString()
        );

        if (existing) {
          existing.score = score.score;
          existing.contributorsJson = score.contributors as unknown as Record<string, unknown>;
          existing.holdStreakDays = holdStreakDays;
          existing.bestHoldStreakDays = bestHoldStreakDays;
          existing.updatedAt = new Date();
        } else {
          devStore.disciplineSnapshots.push({
            id: devStore.makeId("discipline"),
            userId: user.uid,
            asOfDate: asOfDay,
            score: score.score,
            contributorsJson: score.contributors as unknown as Record<string, unknown>,
            holdStreakDays,
            bestHoldStreakDays,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } else {
        await this.prisma.disciplineSnapshot.upsert({
          where: {
            userId_asOfDate: {
              userId: user.uid,
              asOfDate: asOfDay
            }
          },
          create: {
            userId: user.uid,
            asOfDate: asOfDay,
            score: score.score,
            contributorsJson: score.contributors as unknown as Prisma.InputJsonValue,
            holdStreakDays,
            bestHoldStreakDays
          },
          update: {
            score: score.score,
            contributorsJson: score.contributors as unknown as Prisma.InputJsonValue,
            holdStreakDays,
            bestHoldStreakDays
          }
        });
      }
    }

    return {
      asOf: asOf.toISOString(),
      score: score.score,
      rawScore: score.rawScore,
      delta: score.delta,
      contributors: score.contributors,
      contributorLabels: {
        quality: "Quality: strong businesses",
        balance: "Balance: not all-in",
        resilience: "Resilience: calm in stress",
        consistency: "Consistency: weekly review"
      },
      whyChanged: score.whyChanged,
      mainDriver: score.mainDriver,
      suggestions: score.suggestions,
      holdStreakDays,
      bestHoldStreakDays,
      stressModeActive: stress.stressModeActive,
      dueWeeklyReflection,
      trackedCompanies: trackedCompanies.length,
      eligibleCompanies: score.eligibleCompanyCount,
      minimumCompaniesRequired: 3,
      crashHoldRatePct
    };
  }
}
