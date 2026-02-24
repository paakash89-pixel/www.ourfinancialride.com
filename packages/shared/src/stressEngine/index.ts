export interface StressSeriesPoint {
  date: string;
  close: number;
}

export interface DrawdownPoint {
  date: string;
  close: number;
  peak: number;
  peakDate: string;
  drawdownPct: number;
}

export interface StressDetectionConfig {
  lookbackDays: number;
  drawdownThresholdPct: number;
  recoveryWithinPeakPct: number;
  cooldownDays: number;
}

export interface StressPeriodResult {
  startDate: string;
  endDate: string | null;
  peak: number;
  peakDate: string;
  trough: number;
  troughDate: string;
  drawdownPct: number;
  isActive: boolean;
  endReason?: "RECOVERY" | "COOLDOWN";
}

export interface StressState {
  stressModeActive: boolean;
  evaluatedAt: string | null;
  currentDrawdownPct: number;
  peak: number | null;
  peakDate: string | null;
  trough: number | null;
  troughDate: string | null;
  latestClose: number | null;
  activePeriod: StressPeriodResult | null;
  latestPeriod: StressPeriodResult | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const toTime = (value: string): number => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NaN;
};

const normalizeSeries = (series: StressSeriesPoint[]): StressSeriesPoint[] =>
  [...series]
    .filter(
      (point) =>
        typeof point.close === "number" &&
        Number.isFinite(point.close) &&
        point.close > 0 &&
        Number.isFinite(toTime(point.date))
    )
    .sort((a, b) => a.date.localeCompare(b.date));

const datePlusDays = (dateIso: string, days: number): number => {
  const value = new Date(dateIso).getTime();
  return value + days * DAY_MS;
};

export const computeDrawdown = (
  series: StressSeriesPoint[],
  lookbackDays = 30
): DrawdownPoint[] => {
  const points = normalizeSeries(series);
  if (!points.length) return [];

  const output: DrawdownPoint[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const currentTime = toTime(current.date);
    const cutoff = currentTime - Math.max(1, lookbackDays) * DAY_MS;

    let peak = current.close;
    let peakDate = current.date;
    for (let prev = index; prev >= 0; prev -= 1) {
      const previous = points[prev];
      const previousTime = toTime(previous.date);
      if (previousTime < cutoff) break;
      if (previous.close > peak) {
        peak = previous.close;
        peakDate = previous.date;
      }
    }

    const drawdownPct = peak > 0 ? (peak - current.close) / peak : 0;
    output.push({
      date: current.date,
      close: current.close,
      peak,
      peakDate,
      drawdownPct
    });
  }

  return output;
};

export const detectStressPeriods = (
  series: StressSeriesPoint[],
  config: StressDetectionConfig
): StressPeriodResult[] => {
  const drawdowns = computeDrawdown(series, config.lookbackDays);
  if (!drawdowns.length) return [];

  const periods: StressPeriodResult[] = [];
  let current: StressPeriodResult | null = null;

  for (const point of drawdowns) {
    if (!current) {
      if (point.drawdownPct >= config.drawdownThresholdPct) {
        current = {
          startDate: point.date,
          endDate: null,
          peak: point.peak,
          peakDate: point.peakDate,
          trough: point.close,
          troughDate: point.date,
          drawdownPct: point.drawdownPct,
          isActive: true
        };
      }
      continue;
    }

    if (point.peak > current.peak) {
      current.peak = point.peak;
      current.peakDate = point.peakDate;
    }

    if (point.close < current.trough) {
      current.trough = point.close;
      current.troughDate = point.date;
    }
    current.drawdownPct = Math.max(current.drawdownPct, point.drawdownPct);

    const hasRecovered = point.drawdownPct <= config.recoveryWithinPeakPct;
    const cooldownExpired =
      config.cooldownDays > 0 &&
      toTime(point.date) >= datePlusDays(current.startDate, config.cooldownDays);

    if (hasRecovered || cooldownExpired) {
      periods.push({
        ...current,
        endDate: point.date,
        isActive: false,
        endReason: hasRecovered ? "RECOVERY" : "COOLDOWN"
      });
      current = null;
    }
  }

  if (current) {
    periods.push(current);
  }

  return periods;
};

export const detectStress = (
  series: StressSeriesPoint[],
  config: StressDetectionConfig
): StressState => {
  const drawdowns = computeDrawdown(series, config.lookbackDays);
  if (!drawdowns.length) {
    return {
      stressModeActive: false,
      evaluatedAt: null,
      currentDrawdownPct: 0,
      peak: null,
      peakDate: null,
      trough: null,
      troughDate: null,
      latestClose: null,
      activePeriod: null,
      latestPeriod: null
    };
  }

  const periods = detectStressPeriods(series, config);
  const latestPoint = drawdowns[drawdowns.length - 1];
  const activePeriod = [...periods].reverse().find((period) => period.isActive) ?? null;
  const latestPeriod = periods.length ? periods[periods.length - 1] : null;

  return {
    stressModeActive: Boolean(activePeriod),
    evaluatedAt: latestPoint.date,
    currentDrawdownPct: latestPoint.drawdownPct,
    peak: activePeriod?.peak ?? latestPoint.peak,
    peakDate: activePeriod?.peakDate ?? latestPoint.peakDate,
    trough: activePeriod?.trough ?? null,
    troughDate: activePeriod?.troughDate ?? null,
    latestClose: latestPoint.close,
    activePeriod,
    latestPeriod
  };
};

export const STRESS_CONFIG_BY_REGION: Record<"US" | "IN", StressDetectionConfig> = {
  US: {
    lookbackDays: 30,
    drawdownThresholdPct: 0.15,
    recoveryWithinPeakPct: 0.05,
    cooldownDays: 45
  },
  IN: {
    lookbackDays: 30,
    drawdownThresholdPct: 0.12,
    recoveryWithinPeakPct: 0.05,
    cooldownDays: 45
  }
};
