import { Injectable } from "@nestjs/common";
import type { Region } from "@intrinsic/shared";
import { PrismaService } from "../../common/prisma.service";
import { devStore } from "../../common/dev-store";
import type { AuthUser } from "../../common/current-user.decorator";
import type { UpdateProfileDto } from "./dto/update-profile.dto";
import type { DeleteRequestDto } from "./dto/delete-request.dto";
import { EntitlementsService } from "../billing/entitlements.service";
import type { WatchlistDto } from "./dto/watchlist.dto";

const monthKey = (): string => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService
  ) {}

  async getOrCreateProfile(user: AuthUser) {
    if (!this.prisma.isConnected()) {
      const now = new Date();
      const existing = devStore.profiles.get(user.uid) ?? {
        id: user.uid,
        email: user.email,
        region: "US" as Region,
        currency: "USD",
        concentrationLabel: "BALANCED" as const,
        concentrationAcknowledged: false,
        privateMode: false,
        aiMemoryOptIn: false,
        createdAt: now,
        updatedAt: now
      };

      if (user.email) existing.email = user.email;
      existing.updatedAt = now;
      devStore.profiles.set(user.uid, existing);
      return existing;
    }

    return this.prisma.userProfile.upsert({
      where: { id: user.uid },
      create: {
        id: user.uid,
        email: user.email,
        region: "US",
        currency: "USD",
        concentrationLabel: "BALANCED",
        concentrationAcknowledged: false,
        privateMode: false,
        aiMemoryOptIn: false
      },
      update: user.email ? { email: user.email } : {}
    });
  }

  async getProfile(user: AuthUser) {
    return this.getOrCreateProfile(user);
  }

  async updateProfile(user: AuthUser, input: UpdateProfileDto) {
    const profile = await this.getOrCreateProfile(user);

    if (!this.prisma.isConnected()) {
      const concentrationLabel = (
        input.concentrationLabel ??
        profile.concentrationLabel ??
        "BALANCED"
      ) as "BALANCED" | "FOCUSED" | "EXTREME";

      const next = {
        ...profile,
        email: input.email ?? profile.email ?? undefined,
        displayName: input.displayName ?? profile.displayName ?? undefined,
        region: (input.region ?? profile.region) as Region,
        currency:
          input.currency ??
          (input.region ? (input.region === "IN" ? "INR" : "USD") : profile.currency),
        concentrationLabel,
        concentrationAcknowledged:
          input.concentrationAcknowledged ??
          profile.concentrationAcknowledged ??
          false,
        privateMode: input.privateMode ?? profile.privateMode ?? false,
        aiMemoryOptIn: input.aiMemoryOptIn ?? profile.aiMemoryOptIn ?? false,
        disclaimerAcceptedAt: input.disclaimerAccepted
          ? profile.disclaimerAcceptedAt ?? new Date()
          : profile.disclaimerAcceptedAt ?? undefined,
        updatedAt: new Date()
      };
      devStore.profiles.set(user.uid, next);
      return next;
    }

    return this.prisma.userProfile.update({
      where: { id: user.uid },
      data: {
        email: input.email,
        displayName: input.displayName,
        region: input.region,
        currency:
          input.currency ??
          (input.region ? (input.region === "IN" ? "INR" : "USD") : undefined),
        concentrationLabel: input.concentrationLabel,
        concentrationAcknowledged: input.concentrationAcknowledged,
        privateMode: input.privateMode,
        aiMemoryOptIn: input.aiMemoryOptIn,
        disclaimerAcceptedAt: input.disclaimerAccepted
          ? profile.disclaimerAcceptedAt ?? new Date()
          : profile.disclaimerAcceptedAt
      }
    });
  }

  async getEntitlements(user: AuthUser) {
    const profile = await this.getOrCreateProfile(user);
    const active = await this.entitlements.getEffectivePlan({
      userId: user.uid,
      region: profile.region as Region
    });
    const period = monthKey();
    const usage = !this.prisma.isConnected()
      ? devStore.usageCounters.get(devStore.usageKey(user.uid, period))
      : await this.prisma.usageCounter.findUnique({
          where: {
            userId_periodMonth: {
              userId: user.uid,
              periodMonth: period
            }
          }
        });

    return {
      plan: active.plan,
      region: active.region,
      limits: active.limits,
      usage: {
        periodMonth: period,
        analysesUsed: usage?.analysesUsed ?? 0,
        aiMessagesUsed: usage?.aiMessagesUsed ?? 0
      },
      pricingRegion: profile.region,
      currency: profile.currency
    };
  }

  async getWatchlist(user: AuthUser) {
    await this.getOrCreateProfile(user);

    if (!this.prisma.isConnected()) {
      return [...devStore.watchlistItems]
        .filter((item) => item.userId === user.uid)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return this.prisma.watchlistItem.findMany({
      where: { userId: user.uid },
      orderBy: { createdAt: "desc" }
    });
  }

  async addWatchlist(user: AuthUser, input: WatchlistDto) {
    await this.getOrCreateProfile(user);

    if (!this.prisma.isConnected()) {
      const existingCount = devStore.watchlistItems.filter(
        (item) => item.userId === user.uid
      ).length;

      await this.entitlements.ensureWatchlistCanAdd({
        userId: user.uid,
        region: input.region,
        currentCount: existingCount
      });

      const ticker = input.ticker.toUpperCase();
      const existing = devStore.watchlistItems.find(
        (item) => item.userId === user.uid && item.ticker === ticker
      );
      if (existing) {
        existing.region = input.region;
        return existing;
      }

      const item = {
        id: devStore.makeId("wl"),
        userId: user.uid,
        ticker,
        region: input.region,
        createdAt: new Date()
      };
      devStore.watchlistItems.push(item);
      return item;
    }

    const count = await this.prisma.watchlistItem.count({
      where: { userId: user.uid }
    });

    await this.entitlements.ensureWatchlistCanAdd({
      userId: user.uid,
      region: input.region,
      currentCount: count
    });

    return this.prisma.watchlistItem.upsert({
      where: {
        userId_ticker: {
          userId: user.uid,
          ticker: input.ticker.toUpperCase()
        }
      },
      create: {
        userId: user.uid,
        ticker: input.ticker.toUpperCase(),
        region: input.region
      },
      update: {
        region: input.region
      }
    });
  }

  async removeWatchlist(user: AuthUser, ticker: string) {
    await this.getOrCreateProfile(user);

    if (!this.prisma.isConnected()) {
      const normalized = ticker.toUpperCase();
      devStore.watchlistItems = devStore.watchlistItems.filter(
        (item) => !(item.userId === user.uid && item.ticker === normalized)
      );
      return { removed: normalized };
    }

    await this.prisma.watchlistItem.deleteMany({
      where: { userId: user.uid, ticker: ticker.toUpperCase() }
    });
    return { removed: ticker.toUpperCase() };
  }

  async getPccContracts(user: AuthUser) {
    await this.getOrCreateProfile(user);

    if (!this.prisma.isConnected()) {
      return [...devStore.pccContracts]
        .filter((entry) => entry.userId === user.uid)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return this.prisma.pccContract.findMany({
      where: { userId: user.uid },
      orderBy: { createdAt: "desc" }
    });
  }

  async exportData(user: AuthUser) {
    await this.getOrCreateProfile(user);

    if (!this.prisma.isConnected()) {
      return {
        generatedAt: new Date().toISOString(),
        profile: devStore.profiles.get(user.uid) ?? null,
        entitlements: devStore.entitlements.filter((entry) => entry.userId === user.uid),
        usage: [...devStore.usageCounters.values()].filter(
          (entry) => entry.userId === user.uid
        ),
        watchlist: devStore.watchlistItems.filter((entry) => entry.userId === user.uid),
        theses: devStore.theses.filter((entry) => entry.userId === user.uid),
        pccContracts: devStore.pccContracts.filter((entry) => entry.userId === user.uid),
        behaviorEvents: devStore.behaviorEvents.filter((entry) => entry.userId === user.uid),
        regretSnapshots: devStore.regretSnapshots.filter((entry) =>
          devStore.behaviorEvents.some(
            (event) => event.userId === user.uid && event.id === entry.eventId
          )
        ),
        weeklyReflections: devStore.weeklyReflections.filter(
          (entry) => entry.userId === user.uid
        ),
        disciplineSnapshots: devStore.disciplineSnapshots.filter(
          (entry) => entry.userId === user.uid
        ),
        chatMessages: devStore.chatMessages.filter((entry) => entry.userId === user.uid)
      };
    }

    const [
      profile,
      theses,
      entitlements,
      usage,
      watchlist,
      pccContracts,
      behaviorEvents,
      weeklyReflections,
      disciplineSnapshots,
      chatMessages
    ] =
      await Promise.all([
      this.prisma.userProfile.findUnique({ where: { id: user.uid } }),
      this.prisma.thesis.findMany({ where: { userId: user.uid } }),
      this.prisma.entitlement.findMany({ where: { userId: user.uid } }),
      this.prisma.usageCounter.findMany({ where: { userId: user.uid } }),
      this.prisma.watchlistItem.findMany({ where: { userId: user.uid } }),
      this.prisma.pccContract.findMany({ where: { userId: user.uid } }),
      this.prisma.behaviorEvent.findMany({
        where: { userId: user.uid },
        include: { regretSnapshot: true }
      }),
      this.prisma.weeklyReflection.findMany({ where: { userId: user.uid } }),
      this.prisma.disciplineSnapshot.findMany({ where: { userId: user.uid } }),
      this.prisma.chatMessage.findMany({ where: { userId: user.uid } })
    ]);

    return {
      generatedAt: new Date().toISOString(),
      profile,
      entitlements,
      usage,
      watchlist,
      theses,
      pccContracts,
      behaviorEvents,
      weeklyReflections,
      disciplineSnapshots,
      chatMessages
    };
  }

  async deleteData(user: AuthUser, request: DeleteRequestDto) {
    await this.getOrCreateProfile(user);

    if (request.scope === "chat") {
      if (!this.prisma.isConnected()) {
        devStore.chatMessages = devStore.chatMessages.filter(
          (entry) => entry.userId !== user.uid
        );
        return { deleted: "chat" };
      }

      await this.prisma.chatMessage.deleteMany({
        where: { userId: user.uid }
      });
      return { deleted: "chat" };
    }

    if (!this.prisma.isConnected()) {
      devStore.theses = devStore.theses.filter((entry) => entry.userId !== user.uid);
      devStore.entitlements = devStore.entitlements.filter(
        (entry) => entry.userId !== user.uid
      );
      devStore.watchlistItems = devStore.watchlistItems.filter(
        (entry) => entry.userId !== user.uid
      );
      devStore.pccContracts = devStore.pccContracts.filter(
        (entry) => entry.userId !== user.uid
      );
      const deletedEventIds = new Set(
        devStore.behaviorEvents
          .filter((entry) => entry.userId === user.uid)
          .map((entry) => entry.id)
      );
      devStore.behaviorEvents = devStore.behaviorEvents.filter(
        (entry) => entry.userId !== user.uid
      );
      devStore.regretSnapshots = devStore.regretSnapshots.filter(
        (entry) => !deletedEventIds.has(entry.eventId)
      );
      devStore.weeklyReflections = devStore.weeklyReflections.filter(
        (entry) => entry.userId !== user.uid
      );
      devStore.disciplineSnapshots = devStore.disciplineSnapshots.filter(
        (entry) => entry.userId !== user.uid
      );
      devStore.chatMessages = devStore.chatMessages.filter(
        (entry) => entry.userId !== user.uid
      );
      for (const [key, usage] of devStore.usageCounters.entries()) {
        if (usage.userId === user.uid) devStore.usageCounters.delete(key);
      }
      devStore.profiles.delete(user.uid);
      return { deleted: "account" };
    }

    await this.prisma.$transaction([
      this.prisma.thesis.deleteMany({ where: { userId: user.uid } }),
      this.prisma.entitlement.deleteMany({ where: { userId: user.uid } }),
      this.prisma.usageCounter.deleteMany({ where: { userId: user.uid } }),
      this.prisma.watchlistItem.deleteMany({ where: { userId: user.uid } }),
      this.prisma.pccContract.deleteMany({ where: { userId: user.uid } }),
      this.prisma.sellFlowSession.deleteMany({ where: { userId: user.uid } }),
      this.prisma.weeklyReflection.deleteMany({ where: { userId: user.uid } }),
      this.prisma.disciplineSnapshot.deleteMany({ where: { userId: user.uid } }),
      this.prisma.chatMessage.deleteMany({ where: { userId: user.uid } }),
      this.prisma.behaviorEvent.deleteMany({ where: { userId: user.uid } }),
      this.prisma.userProfile.delete({ where: { id: user.uid } })
    ]);

    return { deleted: "account" };
  }
}
