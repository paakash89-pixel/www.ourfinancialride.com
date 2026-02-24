export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

export const average = (values: number[]): number => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
};

export const stdDev = (values: number[]): number => {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

export const stability = (values: number[]): number => {
  if (values.length <= 1) return 0;
  const mean = Math.abs(average(values));
  if (mean === 0) return 0;
  const cv = stdDev(values) / mean;
  return clamp(1 - cv);
};

export const consistency = (
  values: number[],
  predicate: (value: number) => boolean
): number => {
  if (!values.length) return 0;
  const hits = values.filter(predicate).length;
  return hits / values.length;
};

export const trend = (values: number[]): number => {
  const n = values.length;
  if (n <= 1) return 0;

  // Least-squares slope over x=0..n-1
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let x = 0; x < n; x += 1) {
    const y = values[x];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const scale = Math.abs(average(values)) || 1;
  return clamp(slope / scale, -1, 1);
};

export const normalizeRatio = (
  value: number,
  floor: number,
  ceiling: number
): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  if (ceiling === floor) return value >= ceiling ? 1 : 0;
  return clamp((value - floor) / (ceiling - floor));
};

export const invertNormalizeRatio = (
  value: number,
  floor: number,
  ceiling: number
): number => 1 - normalizeRatio(value, floor, ceiling);

export const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;
