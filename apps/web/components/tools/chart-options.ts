"use client";

import type { ChartOptions } from "chart.js";
import { formatCompactMoney } from "../../lib/currency";
import type { MoneyFormatter } from "../../lib/currency";
import type { Region } from "../../lib/region";

type LineAxisConfig = {
  series: number[][];
  includeZero?: boolean;
  paddingRatio?: number;
};

function getDynamicRange(config: LineAxisConfig) {
  const values = config.series
    .flat()
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) return {};

  let min = Math.min(...values);
  let max = Math.max(...values);
  const allNonNegative = min >= 0;

  if (config.includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }

  const range = max - min;
  const ratio = config.paddingRatio ?? 0.12;
  const padding =
    range === 0 ? Math.max(Math.abs(max) * 0.1, 1) : range * ratio;
  let suggestedMin = min - padding;
  let suggestedMax = max + padding;

  // Keep money charts anchored at zero when every value is non-negative.
  // This avoids confusing negative axes for compounding and FI projections.
  if (allNonNegative) {
    suggestedMin = 0;
  }

  if (suggestedMax <= suggestedMin) {
    suggestedMax = suggestedMin + Math.max(Math.abs(max) * 0.1, 1);
  }

  return {
    suggestedMin,
    suggestedMax
  };
}

export function getLineMoneyOptions(
  region: Region,
  money: MoneyFormatter,
  axis: LineAxisConfig
): ChartOptions<"line"> {
  const dynamicRange = getDynamicRange(axis);

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 520,
      easing: "easeOutQuart"
    },
    interaction: { mode: "index", intersect: false },
    layout: {
      padding: { top: 8, right: 6, bottom: 4, left: 2 }
    },
    elements: {
      line: {
        borderCapStyle: "round",
        borderJoinStyle: "round"
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(60, 60, 67, 0.08)", drawTicks: false },
        border: { display: false },
        ticks: {
          color: "#6e6e73",
          maxRotation: 0,
          autoSkipPadding: 18,
          font: { size: 11, weight: 500 }
        }
      },
      y: {
        grid: { color: "rgba(60, 60, 67, 0.10)", drawTicks: false },
        border: { display: false },
        ...dynamicRange,
        ticks: {
          color: "#6e6e73",
          maxTicksLimit: 6,
          padding: 8,
          font: { size: 11, weight: 500 },
          callback: (value) => formatCompactMoney(Number(value), region)
        }
      }
    },
    plugins: {
      legend: {
        position: "top",
        align: "start",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
          color: "#1d1d1f",
          font: { size: 12, weight: 500 },
          padding: 14
        }
      },
      tooltip: {
        displayColors: false,
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        borderColor: "rgba(15, 23, 42, 0.12)",
        borderWidth: 1,
        titleColor: "#1d1d1f",
        bodyColor: "#3a3a3c",
        cornerRadius: 12,
        padding: 10,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label ?? "Value";
            return `${label}: ${money.format(Number(context.parsed.y ?? 0))}`;
          }
        }
      }
    }
  };
}

export function getDoughnutMoneyOptions(
  money: MoneyFormatter
): ChartOptions<"doughnut"> {
  return {
    maintainAspectRatio: false,
    animation: {
      duration: 520,
      easing: "easeOutQuart"
    },
    plugins: {
      legend: {
        position: "top",
        align: "start",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
          color: "#1d1d1f",
          font: { size: 12, weight: 500 },
          padding: 14
        }
      },
      tooltip: {
        displayColors: false,
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        borderColor: "rgba(15, 23, 42, 0.12)",
        borderWidth: 1,
        titleColor: "#1d1d1f",
        bodyColor: "#3a3a3c",
        cornerRadius: 12,
        padding: 10,
        callbacks: {
          label: (context) =>
            `${context.label ?? "Value"}: ${money.format(Number(context.parsed ?? 0))}`
        }
      }
    },
    cutout: "68%"
  };
}
