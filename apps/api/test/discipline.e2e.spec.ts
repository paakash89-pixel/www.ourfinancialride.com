import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { devStore } from "../src/common/dev-store";
import { EntitlementsService } from "../src/modules/billing/entitlements.service";
import { MeService } from "../src/modules/me/me.service";
import { CompanySearchProvider } from "../src/modules/providers/company-search.provider";
import { ProvidersService } from "../src/modules/providers/providers.service";
import { MarketService } from "../src/modules/market/market.service";
import { DisciplineService } from "../src/modules/discipline/discipline.service";
import type { PrismaService } from "../src/common/prisma.service";

describe("Discipline API e2e", () => {
  const prisma = {
    isConnected: () => false
  } as PrismaService;

  const entitlementsService = new EntitlementsService(prisma);
  const meService = new MeService(prisma, entitlementsService);
  const providersService = new ProvidersService(new CompanySearchProvider());
  const marketService = new MarketService(providersService, prisma);
  const disciplineService = new DisciplineService(
    prisma,
    meService,
    providersService,
    marketService
  );

  const user = {
    uid: "e2e-user",
    email: "e2e@intrinsic.app"
  };

  beforeAll(() => {
    process.env.NODE_ENV = "development";
    process.env.INTRINSIC_ENABLE_JOBS = "false";
    process.env.INTRINSIC_ENABLE_LIVE_SEARCH = "false";
    process.env.INTRINSIC_ENABLE_LIVE_FINANCIALS = "false";
    process.env.INTRINSIC_ALLOW_MOCK_FALLBACK = "true";
    process.env.INTRINSIC_DEV_DISABLE_LIMITS = "false";
  });

  beforeEach(() => {
    devStore.reset();
  });

  it("adds and removes tracked companies", async () => {
    await meService.addWatchlist(user, { ticker: "AAPL", region: "US" });
    await meService.addWatchlist(user, { ticker: "MSFT", region: "US" });
    await meService.addWatchlist(user, { ticker: "NVDA", region: "US" });

    const list = await meService.getWatchlist(user);
    expect(list).toHaveLength(3);

    await meService.removeWatchlist(user, "MSFT");
    const afterRemove = await meService.getWatchlist(user);
    expect(afterRemove.map((item) => item.ticker).sort()).toEqual(["AAPL", "NVDA"]);
  });

  it("recalculates discipline score when tracked companies change", async () => {
    await meService.addWatchlist(user, { ticker: "AAPL", region: "US" });
    await meService.addWatchlist(user, { ticker: "MSFT", region: "US" });
    await meService.addWatchlist(user, { ticker: "NVDA", region: "US" });

    const first = await disciplineService.getDisciplineSummary(user);
    expect(first.score).not.toBeNull();
    expect(first.trackedCompanies).toBe(3);
    expect(first.eligibleCompanies).toBeGreaterThanOrEqual(3);

    await meService.addWatchlist(user, { ticker: "AMZN", region: "US" });
    const second = await disciplineService.getDisciplineSummary(user);
    expect(second.score).not.toBeNull();
    expect(second.trackedCompanies).toBe(4);

    await meService.removeWatchlist(user, "AMZN");
    const third = await disciplineService.getDisciplineSummary(user);
    expect(third.score).not.toBeNull();
    expect(third.trackedCompanies).toBe(3);
  });

  it("logs panic event with required reason and enforces server cooldown", async () => {
    await meService.addWatchlist(user, { ticker: "AAPL", region: "US" });

    const start = (await disciplineService.logEvent({
      user,
      payload: {
        action: "START",
        ticker: "AAPL",
        region: "US"
      }
    })) as { cooldownSessionId: string };

    await expect(
      disciplineService.logEvent({
        user,
        payload: {
          action: "COMPLETE",
          ticker: "AAPL",
          region: "US",
          cooldownSessionId: start.cooldownSessionId,
          type: "PANIC_SELL_SIMULATED",
          reasonText: "I felt anxious after drawdown even though facts did not change."
        }
      })
    ).rejects.toThrow("Cooldown still active");

    const session = devStore.sellFlowSessions.find(
      (entry) => entry.id === start.cooldownSessionId
    );
    if (!session) throw new Error("Missing cooldown session");

    session.startedAt = new Date(Date.now() - 31_000);

    const complete = (await disciplineService.logEvent({
      user,
      payload: {
        action: "COMPLETE",
        ticker: "AAPL",
        region: "US",
        cooldownSessionId: start.cooldownSessionId,
        type: "PANIC_SELL_SIMULATED",
        reasonText: "I felt anxious after drawdown even though facts did not change.",
        timestampOverride: "2024-01-15T00:00:00.000Z"
      }
    })) as { ok: boolean; regretPreview: { regret12mPct: number | null } | null };

    expect(complete.ok).toBe(true);
    expect(complete.regretPreview).not.toBeNull();

    const ledger = await disciplineService.getRegretLedger(user);
    expect(ledger.aggregates.panicEventsCount).toBe(1);
  });

  it("applies daily cap unless a panic event occurred since last snapshot", async () => {
    await meService.addWatchlist(user, { ticker: "AAPL", region: "US" });
    await meService.addWatchlist(user, { ticker: "MSFT", region: "US" });
    await meService.addWatchlist(user, { ticker: "NVDA", region: "US" });

    const first = await disciplineService.getDisciplineSummary(user);
    expect(first.score).not.toBeNull();

    devStore.behaviorEvents.push({
      id: devStore.makeId("event"),
      userId: user.uid,
      ticker: "AAPL",
      region: "US",
      type: "HELD",
      reasonText: "Stayed with plan.",
      breakConditionsMet: false,
      breakConditionTriggered: false,
      breakConditionMatches: [],
      stressModeActive: true,
      priceAtEvent: 100,
      createdAt: new Date()
    });

    const second = await disciplineService.getDisciplineSummary(user);
    expect(second.score).not.toBeNull();
    expect(Math.abs((second.score ?? 0) - (first.score ?? 0))).toBeLessThanOrEqual(5);

    devStore.behaviorEvents.push(
      {
        id: devStore.makeId("event"),
        userId: user.uid,
        ticker: "AAPL",
        region: "US",
        type: "PANIC_SELL_SIMULATED",
        reasonText: "Panic test one.",
        breakConditionsMet: false,
        breakConditionTriggered: false,
        breakConditionMatches: [],
        stressModeActive: true,
        priceAtEvent: 98,
        createdAt: new Date()
      },
      {
        id: devStore.makeId("event"),
        userId: user.uid,
        ticker: "MSFT",
        region: "US",
        type: "PANIC_SELL_SIMULATED",
        reasonText: "Panic test two.",
        breakConditionsMet: false,
        breakConditionTriggered: false,
        breakConditionMatches: [],
        stressModeActive: true,
        priceAtEvent: 102,
        createdAt: new Date()
      },
      {
        id: devStore.makeId("event"),
        userId: user.uid,
        ticker: "NVDA",
        region: "US",
        type: "PANIC_SELL_SIMULATED",
        reasonText: "Panic test three.",
        breakConditionsMet: false,
        breakConditionTriggered: false,
        breakConditionMatches: [],
        stressModeActive: true,
        priceAtEvent: 104,
        createdAt: new Date()
      }
    );

    const third = await disciplineService.getDisciplineSummary(user);
    expect(third.score).not.toBeNull();
    expect((third.score ?? 0)).toBeLessThan((second.score ?? 0) - 5);
  });
});
