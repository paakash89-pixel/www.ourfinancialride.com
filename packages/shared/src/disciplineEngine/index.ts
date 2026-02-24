export interface PccRevisionRecord {
  id: string;
  createdAt: string;
  originId?: string;
}

export interface HoldEventRecord {
  type: "PANIC_SELL_SIMULATED" | "HELD";
  timestamp: string;
}

export interface HoldStreakPeriod {
  startDate: string;
  endDate: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const toTime = (value: string): number => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NaN;
};

const toDayKey = (value: string): string => {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const appendPccRevision = (
  existing: PccRevisionRecord[],
  next: PccRevisionRecord
): PccRevisionRecord[] => {
  const ordered = [...existing].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const root = ordered[0];
  const immutableNext = {
    ...next,
    originId: root ? root.originId ?? root.id : undefined
  };
  return [...ordered, immutableNext];
};

export const isCooldownComplete = (params: {
  startedAt: Date;
  now: Date;
  cooldownSeconds?: number;
}): boolean => {
  const cooldownMs = Math.max(1, params.cooldownSeconds ?? 60) * 1000;
  return params.now.getTime() - params.startedAt.getTime() >= cooldownMs;
};

export const computeHoldStreakDays = (params: {
  asOf: string;
  stressPeriods: HoldStreakPeriod[];
  events: HoldEventRecord[];
}): number => {
  const asOfTime = toTime(params.asOf);
  if (!Number.isFinite(asOfTime)) return 0;

  const activePeriods = params.stressPeriods.filter((period) => {
    const start = toTime(period.startDate);
    const end = period.endDate ? toTime(period.endDate) : Number.POSITIVE_INFINITY;
    return Number.isFinite(start) && start <= asOfTime && asOfTime <= end;
  });

  if (!activePeriods.length) return 0;

  const startTime = Math.max(
    ...activePeriods.map((period) => toTime(period.startDate))
  );
  if (!Number.isFinite(startTime) || startTime > asOfTime) return 0;

  const panicDays = new Set(
    params.events
      .filter((event) => event.type === "PANIC_SELL_SIMULATED")
      .map((event) => ({
        key: toDayKey(event.timestamp),
        time: toTime(event.timestamp)
      }))
      .filter((entry) => Number.isFinite(entry.time) && entry.time >= startTime && entry.time <= asOfTime)
      .map((entry) => entry.key)
  );

  let streak = 0;
  const startDay = new Date(startTime);
  startDay.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(asOfTime);
  endDay.setUTCHours(0, 0, 0, 0);

  for (let day = startDay.getTime(); day <= endDay.getTime(); day += DAY_MS) {
    const key = toDayKey(new Date(day).toISOString());
    if (panicDays.has(key)) {
      streak = 0;
      continue;
    }
    streak += 1;
  }

  return streak;
};

export const computeBestHoldStreakDays = (events: HoldEventRecord[]): number => {
  const panicTimes = events
    .filter((event) => event.type === "PANIC_SELL_SIMULATED")
    .map((event) => toTime(event.timestamp))
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b);

  if (!panicTimes.length) {
    return 0;
  }

  const firstPanic = panicTimes[0];
  const lastPanic = panicTimes[panicTimes.length - 1];
  if (!Number.isFinite(firstPanic) || !Number.isFinite(lastPanic)) {
    return 0;
  }

  let bestGap = 0;
  let previous = firstPanic;
  for (let index = 1; index < panicTimes.length; index += 1) {
    const current = panicTimes[index];
    const gapDays = Math.floor((current - previous) / DAY_MS);
    bestGap = Math.max(bestGap, gapDays);
    previous = current;
  }

  // Include run after latest panic through now-equivalent timestamp anchor.
  const tailGapDays = Math.floor((Date.now() - lastPanic) / DAY_MS);
  bestGap = Math.max(bestGap, Math.max(0, tailGapDays));
  return bestGap;
};
