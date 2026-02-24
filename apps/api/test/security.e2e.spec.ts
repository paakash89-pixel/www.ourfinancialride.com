import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";
import { devStore } from "../src/common/dev-store";
import { EntitlementsService } from "../src/modules/billing/entitlements.service";
import { MeService } from "../src/modules/me/me.service";
import { CompanySearchProvider } from "../src/modules/providers/company-search.provider";
import { ProvidersService } from "../src/modules/providers/providers.service";
import { MarketService } from "../src/modules/market/market.service";
import { DisciplineService } from "../src/modules/discipline/discipline.service";
import { LogEventDto } from "../src/modules/discipline/dto/log-event.dto";
import { WatchlistDto } from "../src/modules/me/dto/watchlist.dto";
import type { PrismaService } from "../src/common/prisma.service";

describe("Security checks", () => {
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
    uid: "security-user",
    email: "security@intrinsic.app"
  };

  beforeEach(() => {
    devStore.reset();
  });

  it("does not commit .env file", () => {
    const envFile = resolve(__dirname, "..", "..", ".env");
    expect(existsSync(envFile)).toBe(false);
  });

  it("rate limits /events behavior endpoint", async () => {
    await meService.addWatchlist(user, {
      ticker: "AAPL",
      region: "US"
    });

    let thrown: Error | null = null;
    for (let i = 0; i < 25; i += 1) {
      try {
        await disciplineService.logEvent({
          user,
          payload: {
            action: "START",
            ticker: "AAPL",
            region: "US"
          }
        });
      } catch (error) {
        thrown = error as Error;
        break;
      }
    }

    expect(thrown).not.toBeNull();
    expect(thrown?.message).toContain("Too many event requests");
  });

  it("validates inbound payload shapes for tracked-company and event DTOs", () => {
    const invalidTracked = plainToInstance(WatchlistDto, {
      ticker: "",
      region: "EU"
    });
    const trackedErrors = validateSync(invalidTracked);
    expect(trackedErrors.length).toBeGreaterThan(0);

    const invalidEvent = plainToInstance(LogEventDto, {
      action: "COMPLETE",
      ticker: "AAPL",
      region: "US",
      type: "PANIC_SELL_SIMULATED",
      reasonText: "tiny"
    });
    const eventErrors = validateSync(invalidEvent);
    expect(eventErrors.length).toBeGreaterThan(0);
  });
});
