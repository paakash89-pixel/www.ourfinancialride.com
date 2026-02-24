import { describe, expect, it } from "vitest";
import {
  appendPccRevision,
  computeBestHoldStreakDays,
  computeHoldStreakDays,
  isCooldownComplete
} from "./index";

describe("disciplineEngine", () => {
  it("keeps original PCC immutable when appending revisions", () => {
    const original = {
      id: "pcc_1",
      createdAt: "2026-01-01T00:00:00.000Z"
    };
    const next = {
      id: "pcc_2",
      createdAt: "2026-02-01T00:00:00.000Z"
    };

    const output = appendPccRevision([original], next);
    expect(output).toHaveLength(2);
    expect(output[0]?.id).toBe("pcc_1");
    expect(output[0]?.originId).toBeUndefined();
    expect(output[1]?.originId).toBe("pcc_1");
  });

  it("enforces server cooldown timing", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z");
    const early = new Date("2026-01-01T00:00:40.000Z");
    const onTime = new Date("2026-01-01T00:01:00.000Z");

    expect(
      isCooldownComplete({
        startedAt,
        now: early,
        cooldownSeconds: 60
      })
    ).toBe(false);

    expect(
      isCooldownComplete({
        startedAt,
        now: onTime,
        cooldownSeconds: 60
      })
    ).toBe(true);
  });

  it("computes hold streak during active stress mode and resets after panic days", () => {
    const streak = computeHoldStreakDays({
      asOf: "2026-01-05T12:00:00.000Z",
      stressPeriods: [
        {
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: null
        }
      ],
      events: [
        {
          type: "HELD",
          timestamp: "2026-01-02T09:00:00.000Z"
        },
        {
          type: "PANIC_SELL_SIMULATED",
          timestamp: "2026-01-03T18:00:00.000Z"
        }
      ]
    });

    // Days: Jan 1 (+1), Jan 2 (+1), Jan 3 (reset), Jan 4 (+1), Jan 5 (+1)
    expect(streak).toBe(2);
  });

  it("returns zero hold streak when no active stress period exists", () => {
    const streak = computeHoldStreakDays({
      asOf: "2026-01-05T12:00:00.000Z",
      stressPeriods: [
        {
          startDate: "2025-11-01T00:00:00.000Z",
          endDate: "2025-11-20T00:00:00.000Z"
        }
      ],
      events: []
    });

    expect(streak).toBe(0);
  });

  it("computes best hold streak between panic events", () => {
    const best = computeBestHoldStreakDays([
      {
        type: "PANIC_SELL_SIMULATED",
        timestamp: "2025-01-01T00:00:00.000Z"
      },
      {
        type: "PANIC_SELL_SIMULATED",
        timestamp: "2025-02-15T00:00:00.000Z"
      },
      {
        type: "HELD",
        timestamp: "2025-03-01T00:00:00.000Z"
      }
    ]);

    expect(best).toBeGreaterThanOrEqual(45);
  });
});
