import { describe, expect, it } from "vitest";
import { computeDrawdown, detectStress, detectStressPeriods } from "./index";

const baseSeries = [
  { date: "2025-01-01T00:00:00.000Z", close: 100 },
  { date: "2025-01-10T00:00:00.000Z", close: 110 },
  { date: "2025-01-20T00:00:00.000Z", close: 90 },
  { date: "2025-02-10T00:00:00.000Z", close: 105 },
  { date: "2025-03-01T00:00:00.000Z", close: 108 }
];

describe("stressEngine", () => {
  it("computes drawdown against rolling peak", () => {
    const points = computeDrawdown(baseSeries, 30);
    expect(points[2]?.drawdownPct).toBeCloseTo((110 - 90) / 110, 4);
    expect(points[3]?.drawdownPct).toBeCloseTo(0, 4);
    expect(points[2]?.peakDate).toBe("2025-01-10T00:00:00.000Z");
  });

  it("detects stress period and turns off on recovery", () => {
    const periods = detectStressPeriods(baseSeries, {
      lookbackDays: 30,
      drawdownThresholdPct: 0.15,
      recoveryWithinPeakPct: 0.05,
      cooldownDays: 0
    });

    expect(periods).toHaveLength(1);
    expect(periods[0]?.isActive).toBe(false);
    expect(periods[0]?.startDate).toBe("2025-01-20T00:00:00.000Z");
    expect(periods[0]?.endDate).toBe("2025-02-10T00:00:00.000Z");
    expect(periods[0]?.drawdownPct).toBeCloseTo(0.1818, 3);
    expect(periods[0]?.endReason).toBe("RECOVERY");
  });

  it("keeps period active when no recovery yet", () => {
    const activePeriods = detectStressPeriods(baseSeries.slice(0, 3), {
      lookbackDays: 30,
      drawdownThresholdPct: 0.15,
      recoveryWithinPeakPct: 0.05,
      cooldownDays: 0
    });

    expect(activePeriods).toHaveLength(1);
    expect(activePeriods[0]?.isActive).toBe(true);
    expect(activePeriods[0]?.endDate).toBeNull();
  });

  it("detects active stress state when threshold remains breached", () => {
    const stressSeries = [
      { date: "2025-01-01T00:00:00.000Z", close: 120 },
      { date: "2025-01-10T00:00:00.000Z", close: 121 },
      { date: "2025-01-20T00:00:00.000Z", close: 98 },
      { date: "2025-02-01T00:00:00.000Z", close: 100 }
    ];
    const state = detectStress(stressSeries, {
      lookbackDays: 30,
      drawdownThresholdPct: 0.15,
      recoveryWithinPeakPct: 0.05,
      cooldownDays: 45
    });

    expect(state.stressModeActive).toBe(true);
    expect(state.activePeriod).not.toBeNull();
    expect(state.currentDrawdownPct).toBeGreaterThanOrEqual(0.15);
  });

  it("turns stress off after cooldown if recovery does not happen", () => {
    const noRecoverySeries = [
      { date: "2025-01-01T00:00:00.000Z", close: 100 },
      { date: "2025-01-05T00:00:00.000Z", close: 120 },
      { date: "2025-01-10T00:00:00.000Z", close: 95 },
      { date: "2025-03-10T00:00:00.000Z", close: 98 }
    ];
    const periods = detectStressPeriods(noRecoverySeries, {
      lookbackDays: 120,
      drawdownThresholdPct: 0.15,
      recoveryWithinPeakPct: 0.05,
      cooldownDays: 45
    });

    expect(periods).toHaveLength(1);
    expect(periods[0]?.isActive).toBe(false);
    expect(periods[0]?.endReason).toBe("COOLDOWN");
  });
});
