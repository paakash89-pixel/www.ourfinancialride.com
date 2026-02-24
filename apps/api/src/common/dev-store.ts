import type { EntitlementPlan, Region } from "@intrinsic/shared";

export interface DevProfile {
  id: string;
  email?: string;
  displayName?: string;
  region: Region;
  currency: string;
  concentrationLabel?: "BALANCED" | "FOCUSED" | "EXTREME";
  concentrationAcknowledged?: boolean;
  privateMode?: boolean;
  aiMemoryOptIn?: boolean;
  disclaimerAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevThesis {
  id: string;
  userId: string;
  ticker: string;
  content: string;
  createdAt: Date;
}

export interface DevEntitlement {
  id: string;
  userId: string;
  plan: EntitlementPlan;
  status: string;
  source: "MANUAL" | "REVENUECAT";
  region: Region;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevUsageCounter {
  userId: string;
  periodMonth: string;
  analysesUsed: number;
  aiMessagesUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevWatchlistItem {
  id: string;
  userId: string;
  ticker: string;
  region: Region;
  createdAt: Date;
}

export interface DevCompanySnapshot {
  ticker: string;
  region: Region;
  scoreJson: Record<string, unknown>;
  updatedAt: Date;
}

export interface DevStressPeriod {
  id: string;
  region: Region;
  startDate: Date;
  endDate?: Date;
  peak: number;
  trough: number;
  drawdownPct: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevStressStatus {
  region: Region;
  stressModeActive: boolean;
  drawdownPct: number;
  peakDate?: Date;
  activeStartDate?: Date;
  refreshedAt: Date;
}

export interface DevPccContract {
  id: string;
  userId: string;
  ticker: string;
  region: Region;
  horizonYears: number;
  maxDrawdownTolerance: number;
  thesisHowMoney: string;
  thesisWhyWin10Years: string;
  thesisBreaksPermanently: string;
  breakConditionChecks: string[];
  breakConditionNotes?: string;
  originId?: string;
  version: number;
  immutable: boolean;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface DevSellFlowSession {
  id: string;
  userId: string;
  ticker: string;
  region: Region;
  startedAt: Date;
  expiresAt: Date;
  usedAt?: Date;
}

export interface DevBehaviorEvent {
  id: string;
  userId: string;
  ticker: string;
  region: Region;
  type: "PANIC_SELL_SIMULATED" | "HELD";
  clientEventId?: string;
  reasonText: string;
  breakConditionsMet: boolean;
  breakConditionTriggered: boolean;
  breakConditionMatches?: string[];
  stressModeActive: boolean;
  priceAtEvent: number;
  positionSizeLabel?: "SMALL" | "MEDIUM" | "LARGE" | "CUSTOM";
  notional?: number;
  createdAt: Date;
}

export interface DevRegretSnapshot {
  id: string;
  eventId: string;
  regret3mPct?: number;
  regret6mPct?: number;
  regret12mPct?: number;
  regretCost3m?: number;
  regretCost6m?: number;
  regretCost12m?: number;
  regretCostAmount?: number;
  currency: string;
  createdAt: Date;
}

export interface DevWeeklyReflection {
  id: string;
  userId: string;
  weekStartDate: Date;
  prompt: string;
  responseText: string;
  createdAt: Date;
}

export interface DevDisciplineSnapshot {
  id: string;
  userId: string;
  asOfDate: Date;
  score: number;
  contributorsJson: Record<string, unknown>;
  holdStreakDays: number;
  bestHoldStreakDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevChatMessage {
  id: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  privateMode: boolean;
  memoryEnabled: boolean;
  createdAt: Date;
}

const makeId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const usageKey = (userId: string, periodMonth: string): string =>
  `${userId}:${periodMonth}`;

const snapshotKey = (ticker: string, region: Region): string =>
  `${ticker.toUpperCase()}:${region}`;

export const devStore = {
  profiles: new Map<string, DevProfile>(),
  theses: [] as DevThesis[],
  entitlements: [] as DevEntitlement[],
  usageCounters: new Map<string, DevUsageCounter>(),
  watchlistItems: [] as DevWatchlistItem[],
  companySnapshots: new Map<string, DevCompanySnapshot>(),
  stressPeriods: [] as DevStressPeriod[],
  stressStatuses: new Map<Region, DevStressStatus>(),
  pccContracts: [] as DevPccContract[],
  sellFlowSessions: [] as DevSellFlowSession[],
  behaviorEvents: [] as DevBehaviorEvent[],
  regretSnapshots: [] as DevRegretSnapshot[],
  weeklyReflections: [] as DevWeeklyReflection[],
  disciplineSnapshots: [] as DevDisciplineSnapshot[],
  chatMessages: [] as DevChatMessage[],
  makeId,
  usageKey,
  snapshotKey,
  reset() {
    this.profiles.clear();
    this.theses = [];
    this.entitlements = [];
    this.usageCounters.clear();
    this.watchlistItems = [];
    this.companySnapshots.clear();
    this.stressPeriods = [];
    this.stressStatuses.clear();
    this.pccContracts = [];
    this.sellFlowSessions = [];
    this.behaviorEvents = [];
    this.regretSnapshots = [];
    this.weeklyReflections = [];
    this.disciplineSnapshots = [];
    this.chatMessages = [];
  }
};
