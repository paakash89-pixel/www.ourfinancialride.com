import { describe, expect, it } from "vitest";
import {
  applyEmaWithDailyCap,
  buildWhyChangedMessages,
  computeDisciplineScore,
  resiliencePenalty,
  weightedMean,
  weightedTrimmedMean,
  weightedWinsorizedMean,
  type WeightedPoint
} from "./index";

const baseWeightedPoints: WeightedPoint[] = [
  { score: 40, weight: 1.0 },
  { score: 55, weight: 0.8 },
  { score: 70, weight: 1.0 },
  { score: 85, weight: 1.0 },
  { score: 99, weight: 0.8 }
];

describe("disciplineScore math", () => {
  it("computes weighted mean", () => {
    const mean = weightedMean(baseWeightedPoints);
    expect(mean).toBeCloseTo(70.11, 2);
  });

  it("computes weighted trimmed mean for 5-9 names", () => {
    const trimmed = weightedTrimmedMean(baseWeightedPoints, 1);
    expect(trimmed).toBeCloseTo(69.64, 2);
  });

  it("computes weighted winsorized mean for 10+ names", () => {
    const winsorized = weightedWinsorizedMean(
      [
        { score: 15, weight: 1 },
        { score: 32, weight: 1 },
        { score: 47, weight: 1 },
        { score: 53, weight: 1 },
        { score: 61, weight: 1 },
        { score: 69, weight: 1 },
        { score: 76, weight: 1 },
        { score: 82, weight: 1 },
        { score: 91, weight: 1 },
        { score: 100, weight: 1 }
      ],
      0.1
    );

    expect(winsorized).toBeCloseTo(67.2, 2);
  });

  it("applies EMA smoothing and daily cap", () => {
    const capped = applyEmaWithDailyCap({
      rawScore: 92,
      previousScore: 50,
      alpha: 0.25,
      panicEventSinceLastUpdate: false
    });
    expect(capped).toBe(55);

    const uncappedOnPanic = applyEmaWithDailyCap({
      rawScore: 10,
      previousScore: 70,
      alpha: 0.25,
      panicEventSinceLastUpdate: true
    });
    expect(uncappedOnPanic).toBe(55);
  });

  it("follows the resilience penalty curve", () => {
    expect(resiliencePenalty(0)).toBeCloseTo(0, 6);
    expect(resiliencePenalty(1)).toBeGreaterThan(12);
    expect(resiliencePenalty(2)).toBeGreaterThan(resiliencePenalty(1));
    expect(resiliencePenalty(5)).toBeGreaterThan(24);
  });
});

describe("disciplineScore behavior", () => {
  it("hides score until at least 3 eligible companies are tracked", () => {
    const result = computeDisciplineScore({
      asOf: "2026-02-18T00:00:00.000Z",
      companies: [
        { ticker: "AAA", ownerScore: 78, confidence: "HIGH", sector: "TECH" },
        { ticker: "BBB", ownerScore: 74, confidence: "MED", sector: "BANKS" }
      ],
      events: [],
      weeklyCheckinLastAt: "2026-02-15T00:00:00.000Z"
    });

    expect(result.score).toBeNull();
    expect(result.whyChanged).toContain("Add 3 companies to start your Discipline Score.");
  });

  it("computes deterministic portfolio discipline score with contributors", () => {
    const result = computeDisciplineScore({
      asOf: "2026-02-18T00:00:00.000Z",
      previousScore: 64,
      companies: [
        { ticker: "AAA", ownerScore: 88, confidence: "HIGH", sector: "TECH" },
        { ticker: "BBB", ownerScore: 82, confidence: "MED", sector: "BANKS" },
        { ticker: "CCC", ownerScore: 77, confidence: "HIGH", sector: "INDUSTRIALS" },
        { ticker: "DDD", ownerScore: 70, confidence: "LOW", sector: "ENERGY" }
      ],
      events: [
        { type: "HELD", stressModeActive: true, createdAt: "2026-01-12T00:00:00.000Z" },
        {
          type: "PANIC_SELL_SIMULATED",
          stressModeActive: true,
          createdAt: "2025-06-02T00:00:00.000Z"
        }
      ],
      weeklyCheckinLastAt: "2026-02-16T00:00:00.000Z",
      fallbackMostlyOneStock: false
    });

    expect(result.score).not.toBeNull();
    expect(result.rawScore).not.toBeNull();
    expect(result.eligibleCompanyCount).toBe(3);
    expect(result.excludedCompanyCount).toBe(1);
    expect(result.contributors.quality).toBeGreaterThan(20);
    expect(result.contributors.balance).toBe(16);
    expect(result.contributors.consistency).toBe(10);
    expect(Math.abs(result.delta)).toBeLessThanOrEqual(5);
  });
});

describe("why changed messages", () => {
  it("builds stable plain-English messages", () => {
    const message = buildWhyChangedMessages({
      previous: {
        score: 70,
        rawScore: 70,
        contributors: {
          quality: 25,
          balance: 16,
          resilience: 20,
          consistency: 9
        },
        eligibleCompanyCount: 5,
        excludedCompanyCount: 0
      },
      current: {
        score: 73,
        rawScore: 73,
        contributors: {
          quality: 29,
          balance: 16,
          resilience: 20,
          consistency: 8
        },
        eligibleCompanyCount: 5,
        excludedCompanyCount: 0
      }
    });

    expect(message).toMatchSnapshot();
  });

  it("emits panic-specific explanation when panic happened", () => {
    const message = buildWhyChangedMessages({
      previous: {
        score: 72,
        rawScore: 72,
        contributors: {
          quality: 31,
          balance: 16,
          resilience: 19,
          consistency: 6
        },
        eligibleCompanyCount: 5,
        excludedCompanyCount: 0
      },
      current: {
        score: 60,
        rawScore: 60,
        contributors: {
          quality: 31,
          balance: 16,
          resilience: 6,
          consistency: 7
        },
        eligibleCompanyCount: 5,
        excludedCompanyCount: 0
      },
      panicEventSinceLastUpdate: true
    });

    expect(message).toMatchSnapshot();
  });
});
