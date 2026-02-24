import { Injectable, ForbiddenException } from "@nestjs/common";
import type { EntitlementPlan, Region } from "@intrinsic/shared";
import { devStore } from "../../common/dev-store";
import { PrismaService } from "../../common/prisma.service";

export interface PlanLimits {
  analysesPerMonth: number | null;
  aiCoachMessagesPerMonth: number | null;
  watchlistLimit: number | null;
  ownedLimit: number | null;
  pccLimit: number | null;
  dataRefreshCadence: "WEEKLY" | "NIGHTLY";
  regretExportEnabled: boolean;
}

const MONTH_KEY = (): string => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  private get devUnlimitedMode(): boolean {
    if (process.env.NODE_ENV === "production") return false;
    return process.env.INTRINSIC_DEV_DISABLE_LIMITS === "true";
  }

  planLimits(plan: EntitlementPlan): PlanLimits {
    if (this.devUnlimitedMode) {
      return {
        analysesPerMonth: null,
        aiCoachMessagesPerMonth: null,
        watchlistLimit: null,
        ownedLimit: null,
        pccLimit: null,
        dataRefreshCadence: "NIGHTLY",
        regretExportEnabled: true
      };
    }

    if (plan === "OWNER") {
      return {
        analysesPerMonth: null,
        aiCoachMessagesPerMonth: null,
        watchlistLimit: null,
        ownedLimit: null,
        pccLimit: null,
        dataRefreshCadence: "NIGHTLY",
        regretExportEnabled: true
      };
    }

    return {
      analysesPerMonth: null,
      aiCoachMessagesPerMonth: 30,
      watchlistLimit: 10,
      ownedLimit: 10,
      pccLimit: 10,
      dataRefreshCadence: "WEEKLY",
      regretExportEnabled: false
    };
  }

  async getEffectivePlan(params: {
    userId: string;
    region: Region;
  }): Promise<{ plan: EntitlementPlan; region: Region; limits: PlanLimits }> {
    if (!this.prisma.isConnected()) {
      const active = [...devStore.entitlements]
        .filter(
          (entry) =>
            entry.userId === params.userId &&
            entry.status === "ACTIVE" &&
            (!entry.expiresAt || entry.expiresAt > new Date())
        )
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

      const plan: EntitlementPlan = active?.plan ?? "EXPLORER";
      return {
        plan,
        region: active?.region ?? params.region,
        limits: this.planLimits(plan)
      };
    }

    const active = await this.prisma.entitlement.findFirst({
      where: {
        userId: params.userId,
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      orderBy: { updatedAt: "desc" }
    });

    const plan: EntitlementPlan = active?.plan === "OWNER" ? "OWNER" : "EXPLORER";
    return {
      plan,
      region: (active?.region as Region | undefined) ?? params.region,
      limits: this.planLimits(plan)
    };
  }

  async ensureUsageAllowed(params: {
    userId: string;
    region: Region;
    kind: "ANALYSIS" | "AI_CHAT";
  }): Promise<void> {
    if (this.devUnlimitedMode) return;

    const entitlement = await this.getEffectivePlan({
      userId: params.userId,
      region: params.region
    });

    if (entitlement.plan === "OWNER") return;

    const usage = this.prisma.isConnected()
      ? await this.prisma.usageCounter.findUnique({
          where: {
            userId_periodMonth: {
              userId: params.userId,
              periodMonth: MONTH_KEY()
            }
          }
        })
      : devStore.usageCounters.get(devStore.usageKey(params.userId, MONTH_KEY()));

    if (params.kind === "ANALYSIS") {
      const used = usage?.analysesUsed ?? 0;
      const limit = entitlement.limits.analysesPerMonth;
      if (limit !== null && used >= limit) {
        throw new ForbiddenException("Monthly analysis limit reached on Explorer plan");
      }
      return;
    }

    if (params.kind === "AI_CHAT") {
      const used = usage?.aiMessagesUsed ?? 0;
      const limit = entitlement.limits.aiCoachMessagesPerMonth;
      if (limit !== null && used >= limit) {
        throw new ForbiddenException("Monthly AI coach message limit reached on Explorer plan");
      }
    }
  }

  async ensureWatchlistCanAdd(params: {
    userId: string;
    region: Region;
    currentCount: number;
  }): Promise<void> {
    if (this.devUnlimitedMode) return;

    const entitlement = await this.getEffectivePlan({
      userId: params.userId,
      region: params.region
    });

    const limit = entitlement.limits.watchlistLimit;
    if (limit !== null && params.currentCount >= limit) {
      throw new ForbiddenException("Watchlist limit reached on Explorer plan");
    }
  }

  async incrementUsage(params: {
    userId: string;
    kind: "ANALYSIS" | "AI_CHAT";
  }): Promise<void> {
    if (this.devUnlimitedMode) return;

    const periodMonth = MONTH_KEY();

    if (!this.prisma.isConnected()) {
      const key = devStore.usageKey(params.userId, periodMonth);
      const existing = devStore.usageCounters.get(key) ?? {
        userId: params.userId,
        periodMonth,
        analysesUsed: 0,
        aiMessagesUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (params.kind === "ANALYSIS") {
        existing.analysesUsed += 1;
      } else {
        existing.aiMessagesUsed += 1;
      }
      existing.updatedAt = new Date();
      devStore.usageCounters.set(key, existing);
      return;
    }

    await this.prisma.usageCounter.upsert({
      where: {
        userId_periodMonth: {
          userId: params.userId,
          periodMonth
        }
      },
      create: {
        user: { connect: { id: params.userId } },
        periodMonth,
        analysesUsed: params.kind === "ANALYSIS" ? 1 : 0,
        aiMessagesUsed: params.kind === "AI_CHAT" ? 1 : 0
      },
      update:
        params.kind === "ANALYSIS"
          ? { analysesUsed: { increment: 1 } }
          : { aiMessagesUsed: { increment: 1 } }
    });
  }

  async ensureOwnedCanAdd(params: {
    userId: string;
    region: Region;
    currentCount: number;
  }): Promise<void> {
    if (this.devUnlimitedMode) return;

    const entitlement = await this.getEffectivePlan({
      userId: params.userId,
      region: params.region
    });

    const limit = entitlement.limits.ownedLimit;
    if (limit !== null && params.currentCount >= limit) {
      throw new ForbiddenException("Owned position limit reached on Explorer plan");
    }
  }

  async applyEntitlementEvent(params: {
    userId: string;
    plan: EntitlementPlan;
    source: "REVENUECAT" | "MANUAL";
    region: Region;
    expiresAt?: string;
    status?: string;
  }): Promise<void> {
    if (!this.prisma.isConnected()) {
      const now = new Date();
      const profile = devStore.profiles.get(params.userId) ?? {
        id: params.userId,
        region: params.region,
        currency: params.region === "IN" ? "INR" : "USD",
        createdAt: now,
        updatedAt: now
      };
      profile.region = params.region;
      profile.currency = params.region === "IN" ? "INR" : "USD";
      profile.updatedAt = now;
      devStore.profiles.set(params.userId, profile);

      devStore.entitlements.push({
        id: devStore.makeId("ent"),
        userId: params.userId,
        plan: params.plan,
        source: params.source,
        status: params.status ?? "ACTIVE",
        region: params.region,
        expiresAt: params.expiresAt ? new Date(params.expiresAt) : undefined,
        createdAt: now,
        updatedAt: now
      });
      return;
    }

    await this.prisma.userProfile.upsert({
      where: { id: params.userId },
      create: {
        id: params.userId,
        region: params.region,
        currency: params.region === "IN" ? "INR" : "USD"
      },
      update: {
        region: params.region,
        currency: params.region === "IN" ? "INR" : "USD"
      }
    });

    await this.prisma.entitlement.create({
      data: {
        userId: params.userId,
        plan: params.plan === "OWNER" ? "OWNER" : "EXPLORER",
        source: params.source,
        status: params.status ?? "ACTIVE",
        region: params.region,
        expiresAt: params.expiresAt ? new Date(params.expiresAt) : null
      }
    });
  }
}
