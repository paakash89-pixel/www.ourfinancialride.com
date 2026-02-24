import { describe, expect, it } from "vitest";
import { computeRegretOutcomes, nearestTradingDay } from "./index";

const prices = [
  { date: "2025-01-02T00:00:00.000Z", close: 100 },
  { date: "2025-01-03T00:00:00.000Z", close: 101 },
  { date: "2025-04-04T00:00:00.000Z", close: 110 },
  { date: "2025-07-07T00:00:00.000Z", close: 120 },
  { date: "2026-01-05T00:00:00.000Z", close: 140 }
];

describe("regretEngine", () => {
  it("finds nearest trading day for non-trading date", () => {
    const nearest = nearestTradingDay(prices, "2025-01-04T00:00:00.000Z");
    expect(nearest?.date).toBe("2025-01-03T00:00:00.000Z");
  });

  it("computes 3m/6m/12m regret using nearest trading dates", () => {
    const result = computeRegretOutcomes({
      series: prices,
      eventDate: "2025-01-04T00:00:00.000Z",
      notional: 1000
    });

    expect(result).not.toBeNull();
    expect(result?.nearestEventDate).toBe("2025-01-03T00:00:00.000Z");
    expect(result?.results).toHaveLength(3);

    const threeMonth = result?.results.find((item) => item.horizonMonths === 3);
    expect(threeMonth?.targetDate).toBe("2025-04-04T00:00:00.000Z");
    expect(threeMonth?.regretPct).toBeCloseTo(8.91, 2);
    expect(threeMonth?.regretCost).toBeCloseTo(89.1, 1);
  });
});
