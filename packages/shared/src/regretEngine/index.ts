export interface TradingPoint {
  date: string;
  close: number;
}

export interface RegretHorizonResult {
  horizonMonths: 3 | 6 | 12;
  eventDate: string;
  targetDate: string;
  eventPrice: number;
  targetPrice: number;
  regretPct: number;
  regretCost: number | null;
}

export interface RegretComputationResult {
  nearestEventDate: string;
  nearestEventPrice: number;
  results: RegretHorizonResult[];
}

const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeSeries = (series: TradingPoint[]): TradingPoint[] =>
  [...series]
    .filter(
      (point) =>
        typeof point.close === "number" &&
        Number.isFinite(point.close) &&
        point.close > 0 &&
        Number.isFinite(new Date(point.date).getTime())
    )
    .sort((a, b) => a.date.localeCompare(b.date));

const addMonths = (dateIso: string, months: number): string => {
  const date = new Date(dateIso);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString();
};

export const nearestTradingDay = (
  series: TradingPoint[],
  targetDateIso: string
): TradingPoint | null => {
  const points = normalizeSeries(series);
  if (!points.length) return null;

  const target = new Date(targetDateIso).getTime();
  if (!Number.isFinite(target)) return null;

  let best = points[0];
  let bestDistance = Math.abs(new Date(best.date).getTime() - target);

  for (let index = 1; index < points.length; index += 1) {
    const current = points[index];
    const distance = Math.abs(new Date(current.date).getTime() - target);
    if (distance < bestDistance) {
      best = current;
      bestDistance = distance;
      continue;
    }

    if (distance === bestDistance && current.date > best.date) {
      best = current;
    }
  }

  return best;
};

export const computeRegretOutcomes = (params: {
  series: TradingPoint[];
  eventDate: string;
  notional?: number;
}): RegretComputationResult | null => {
  const series = normalizeSeries(params.series);
  if (!series.length) return null;

  const eventPoint = nearestTradingDay(series, params.eventDate);
  if (!eventPoint) return null;

  const horizons = [3, 6, 12] as const;
  const results: RegretHorizonResult[] = [];

  for (const horizon of horizons) {
    const targetDate = addMonths(eventPoint.date, horizon);
    const targetPoint = nearestTradingDay(series, targetDate);
    if (!targetPoint) continue;

    const regretPct = ((targetPoint.close - eventPoint.close) / eventPoint.close) * 100;
    const regretCost =
      typeof params.notional === "number" && Number.isFinite(params.notional)
        ? round2((params.notional * regretPct) / 100)
        : null;

    results.push({
      horizonMonths: horizon,
      eventDate: eventPoint.date,
      targetDate: targetPoint.date,
      eventPrice: eventPoint.close,
      targetPrice: targetPoint.close,
      regretPct: round2(regretPct),
      regretCost
    });
  }

  return {
    nearestEventDate: eventPoint.date,
    nearestEventPrice: eventPoint.close,
    results
  };
};
