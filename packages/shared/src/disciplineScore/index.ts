import type { BehaviorEventType } from "../types/domain";

const DAY_MS = 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const clamp01 = (value: number): number => clamp(value, 0, 1);

const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const toTime = (value: string | null | undefined): number => {
  if (!value) return Number.NaN;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export type ConfidenceForDiscipline = "HIGH" | "MED" | "LOW" | "BELOW_MINIMUM";

export interface PortfolioCompanyForDiscipline {
  ticker: string;
  ownerScore: number;
  confidence: ConfidenceForDiscipline;
  sector?: string | null;
}

export interface DisciplineBehaviorEvent {
  type: BehaviorEventType;
  createdAt: string;
  stressModeActive?: boolean;
}

export interface WeightedPoint {
  score: number;
  weight: number;
}

export interface DisciplineContributors {
  quality: number;
  balance: number;
  resilience: number;
  consistency: number;
}

export interface DisciplineComputationInput {
  asOf: string;
  companies: PortfolioCompanyForDiscipline[];
  events?: DisciplineBehaviorEvent[];
  weeklyCheckinLastAt?: string | null;
  fallbackMostlyOneStock?: boolean | null;
  previousScore?: number | null;
  alpha?: number;
  panicEventSinceLastUpdate?: boolean;
}

export interface DisciplineSnapshot {
  score: number | null;
  rawScore: number | null;
  contributors: DisciplineContributors;
  eligibleCompanyCount: number;
  excludedCompanyCount: number;
}

export interface DisciplineComputationResult extends DisciplineSnapshot {
  qualityRaw: number | null;
  delta: number;
  whyChanged: string[];
  mainDriver: "QUALITY" | "BALANCE" | "RESILIENCE" | "CONSISTENCY" | "UNAVAILABLE";
  suggestions: string[];
}

const confidenceWeight = (confidence: ConfidenceForDiscipline): number => {
  if (confidence === "HIGH") return 1.0;
  if (confidence === "MED") return 0.8;
  return 0;
};

const sectorCountToPoints = (sectorCount: number): number => {
  if (sectorCount >= 4) return 20;
  if (sectorCount === 3) return 16;
  if (sectorCount === 2) return 10;
  return 4;
};

const contributorLabel: Record<keyof DisciplineContributors, string> = {
  quality: "Quality (strong businesses)",
  balance: "Balance (not all-in)",
  resilience: "Resilience (calm in stress)",
  consistency: "Consistency (weekly review)"
};

const byScoreAsc = (a: WeightedPoint, b: WeightedPoint): number => a.score - b.score;

const sanitizeWeightedPoints = (points: WeightedPoint[]): WeightedPoint[] =>
  points.filter(
    (point) =>
      Number.isFinite(point.score) &&
      Number.isFinite(point.weight) &&
      point.score >= 0 &&
      point.score <= 100 &&
      point.weight > 0
  );

export const weightedMean = (points: WeightedPoint[]): number => {
  const clean = sanitizeWeightedPoints(points);
  if (!clean.length) return 0;

  const numerator = clean.reduce((sum, point) => sum + point.score * point.weight, 0);
  const denominator = clean.reduce((sum, point) => sum + point.weight, 0);
  if (denominator <= 0) return 0;
  return numerator / denominator;
};

export const weightedTrimmedMean = (
  points: WeightedPoint[],
  trimCount = 1
): number => {
  const clean = sanitizeWeightedPoints(points);
  if (!clean.length) return 0;
  const safeTrim = Math.max(0, Math.floor(trimCount));
  if (safeTrim === 0) return weightedMean(clean);
  if (clean.length <= safeTrim * 2) return weightedMean(clean);
  const sorted = [...clean].sort(byScoreAsc);
  return weightedMean(sorted.slice(safeTrim, sorted.length - safeTrim));
};

export const weightedWinsorizedMean = (
  points: WeightedPoint[],
  tailPct = 0.1
): number => {
  const clean = sanitizeWeightedPoints(points);
  if (!clean.length) return 0;

  const boundedTail = clamp(tailPct, 0, 0.49);
  const sorted = [...clean].sort(byScoreAsc);
  const k = Math.floor(sorted.length * boundedTail);
  if (k <= 0) return weightedMean(sorted);

  const lower = sorted[k]?.score ?? sorted[0]?.score ?? 0;
  const upper = sorted[sorted.length - 1 - k]?.score ?? sorted[sorted.length - 1]?.score ?? 0;

  return weightedMean(
    sorted.map((point) => ({
      score: clamp(point.score, lower, upper),
      weight: point.weight
    }))
  );
};

export const resiliencePenalty = (panicEventsLast365d: number): number => {
  const p = Math.max(0, panicEventsLast365d);
  return 25 * (1 - Math.exp(-0.7 * p));
};

export const applyEmaWithDailyCap = (params: {
  rawScore: number;
  previousScore?: number | null;
  alpha?: number;
  dailyCap?: number;
  panicEventSinceLastUpdate?: boolean;
}): number => {
  const raw = clamp(params.rawScore, 0, 100);
  const alpha = clamp(params.alpha ?? 0.25, 0.01, 1);
  const prev = params.previousScore;
  if (typeof prev !== "number" || !Number.isFinite(prev)) {
    return Math.round(raw);
  }

  const ema = alpha * raw + (1 - alpha) * prev;
  const cap = Math.max(0, params.dailyCap ?? 5);
  const skipCap = Boolean(params.panicEventSinceLastUpdate);

  const capped = skipCap ? ema : clamp(ema, prev - cap, prev + cap);
  return Math.round(clamp(capped, 0, 100));
};

const qualityCalculation = (points: WeightedPoint[]): { raw: number; points: number } => {
  const count = points.length;
  if (!count) return { raw: 0, points: 0 };

  let qRaw = 0;
  if (count < 5) {
    qRaw = weightedMean(points);
  } else if (count < 10) {
    qRaw = weightedTrimmedMean(points, 1);
  } else {
    qRaw = weightedWinsorizedMean(points, 0.1);
  }

  const qualityPoints = 45 * clamp01((qRaw - 50) / 40);
  return { raw: round2(qRaw), points: round2(qualityPoints) };
};

const balanceCalculation = (params: {
  companies: PortfolioCompanyForDiscipline[];
  fallbackMostlyOneStock?: boolean | null;
}): number => {
  const sectors = new Set(
    params.companies
      .map((company) => company.sector?.trim().toUpperCase() ?? "")
      .filter((sector) => Boolean(sector) && sector !== "UNKNOWN")
  );

  const allHaveSector =
    params.companies.length > 0 &&
    params.companies.every((company) => {
      const sector = company.sector?.trim();
      return Boolean(sector) && sector?.toUpperCase() !== "UNKNOWN";
    });

  if (allHaveSector) {
    return sectorCountToPoints(sectors.size);
  }

  if (params.fallbackMostlyOneStock === true) return 6;
  if (params.fallbackMostlyOneStock === false) return 16;
  return 10;
};

const consistencyCalculation = (
  asOfTime: number,
  weeklyCheckinLastAt?: string | null
): number => {
  const checkinTime = toTime(weeklyCheckinLastAt);
  if (!Number.isFinite(checkinTime)) return 0;

  const ageDays = Math.floor((asOfTime - checkinTime) / DAY_MS);
  if (ageDays <= 7) return 10;
  if (ageDays <= 14) return 6;
  return 0;
};

const resilienceCalculation = (
  asOfTime: number,
  events: DisciplineBehaviorEvent[]
): number => {
  const recentEvents = events.filter((event) => {
    const time = toTime(event.createdAt);
    if (!Number.isFinite(time)) return false;
    const ageDays = (asOfTime - time) / DAY_MS;
    return ageDays >= 0 && ageDays <= 365;
  });

  const panicCount = recentEvents.filter(
    (event) => event.type === "PANIC_SELL_SIMULATED"
  ).length;
  const heldBonus = Math.min(
    5,
    recentEvents.filter((event) => event.type === "HELD" && event.stressModeActive).length
  );

  const points = 25 - resiliencePenalty(panicCount) + heldBonus;
  return round2(clamp(points, 0, 25));
};

export const buildWhyChangedMessages = (params: {
  previous: DisciplineSnapshot | null;
  current: DisciplineSnapshot;
  panicEventSinceLastUpdate?: boolean;
}): {
  mainDriver: "QUALITY" | "BALANCE" | "RESILIENCE" | "CONSISTENCY" | "UNAVAILABLE";
  messages: string[];
} => {
  if (params.current.score === null) {
    return {
      mainDriver: "UNAVAILABLE",
      messages: ["Add 3 companies to start your Discipline Score."]
    };
  }

  if (!params.previous || params.previous.score === null) {
    return {
      mainDriver: "QUALITY",
      messages: ["Discipline Score started. Keep weekly reviews and avoid panic logs."]
    };
  }

  const deltas = {
    quality: params.current.contributors.quality - params.previous.contributors.quality,
    balance: params.current.contributors.balance - params.previous.contributors.balance,
    resilience:
      params.current.contributors.resilience - params.previous.contributors.resilience,
    consistency:
      params.current.contributors.consistency - params.previous.contributors.consistency
  };

  const entries = (Object.keys(deltas) as Array<keyof typeof deltas>).map((key) => ({
    key,
    delta: deltas[key]
  }));

  const strongest = entries.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const mainKey = strongest?.key ?? "quality";
  const mainDelta = strongest?.delta ?? 0;

  if (params.panicEventSinceLastUpdate) {
    return {
      mainDriver: "RESILIENCE",
      messages: ["Score fell mainly from a panic log. Use the pause flow next time."]
    };
  }

  if (Math.abs(mainDelta) < 0.2) {
    return {
      mainDriver: "CONSISTENCY",
      messages: ["Score was steady today. Keep the weekly review habit going."]
    };
  }

  const direction = mainDelta > 0 ? "improved" : "dipped";
  return {
    mainDriver: mainKey.toUpperCase() as
      | "QUALITY"
      | "BALANCE"
      | "RESILIENCE"
      | "CONSISTENCY",
    messages: [
      `${contributorLabel[mainKey]} ${direction} and moved your score.`,
      mainKey === "quality"
        ? "Track durable businesses with enough history."
        : mainKey === "balance"
          ? "Avoid being concentrated in one area."
          : mainKey === "resilience"
            ? "Panic logs hurt this component; held logs during stress help."
            : "Complete one weekly review to keep this strong."
    ]
  };
};

export const computeDisciplineScore = (
  input: DisciplineComputationInput
): DisciplineComputationResult => {
  const asOfTime = toTime(input.asOf);
  const safeAsOfTime = Number.isFinite(asOfTime) ? asOfTime : Date.now();
  const events = input.events ?? [];

  const eligible = input.companies
    .map((company) => {
      const score = clamp(company.ownerScore, 0, 100);
      const weight = confidenceWeight(company.confidence);
      return {
        ...company,
        ownerScore: score,
        weight
      };
    })
    .filter((company) => company.weight > 0);

  const weightedPoints: WeightedPoint[] = eligible.map((company) => ({
    score: company.ownerScore,
    weight: company.weight
  }));

  const quality = qualityCalculation(weightedPoints);
  const balance = balanceCalculation({
    companies: eligible,
    fallbackMostlyOneStock: input.fallbackMostlyOneStock
  });
  const resilience = resilienceCalculation(safeAsOfTime, events);
  const consistency = consistencyCalculation(safeAsOfTime, input.weeklyCheckinLastAt);

  const contributors: DisciplineContributors = {
    quality: round2(quality.points),
    balance: round2(balance),
    resilience: round2(resilience),
    consistency: round2(consistency)
  };

  const eligibleCount = eligible.length;
  const excludedCount = input.companies.length - eligibleCount;

  const rawScore =
    eligibleCount >= 3
      ? round2(
          contributors.quality +
            contributors.balance +
            contributors.resilience +
            contributors.consistency
        )
      : null;

  const score =
    rawScore === null
      ? null
      : applyEmaWithDailyCap({
          rawScore,
          previousScore: input.previousScore ?? null,
          alpha: input.alpha ?? 0.25,
          dailyCap: 5,
          panicEventSinceLastUpdate: input.panicEventSinceLastUpdate
        });

  const delta =
    score === null
      ? 0
      : typeof input.previousScore === "number" && Number.isFinite(input.previousScore)
        ? score - input.previousScore
        : 0;

  const currentSnapshot: DisciplineSnapshot = {
    score,
    rawScore,
    contributors,
    eligibleCompanyCount: eligibleCount,
    excludedCompanyCount: excludedCount
  };

  const previousSnapshot =
    typeof input.previousScore === "number" && Number.isFinite(input.previousScore)
      ? {
          score: input.previousScore,
          rawScore: input.previousScore,
          contributors,
          eligibleCompanyCount: eligibleCount,
          excludedCompanyCount: excludedCount
        }
      : null;

  const why = buildWhyChangedMessages({
    previous: previousSnapshot,
    current: currentSnapshot,
    panicEventSinceLastUpdate: input.panicEventSinceLastUpdate
  });

  const suggestions =
    score === null
      ? ["Add 3 companies to start."]
      : [
          contributors.consistency < 10
            ? "Complete this week’s review."
            : contributors.resilience < 18
              ? "Use the pause flow before logging panic."
              : contributors.balance < 16
                ? "Spread exposure across more than one area."
                : "Stay consistent. You are building a durable discipline habit."
        ];

  return {
    ...currentSnapshot,
    qualityRaw: eligibleCount ? quality.raw : null,
    delta,
    whyChanged: why.messages,
    mainDriver: why.mainDriver,
    suggestions
  };
};
