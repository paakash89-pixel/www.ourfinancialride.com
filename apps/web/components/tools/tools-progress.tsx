"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  compoundSchema,
  computeCompound,
  computeFi,
  computeSavingsGuard,
  computeWithdrawal,
  fiSchema,
  savingsGuardSchema,
  withdrawalSchema
} from "../../lib/calculators";

const TOOL_PROGRESS_EVENT = "ofr-tool-progress-update";

type ScoreItem = {
  label: string;
  score: number | null;
};

const emptyScores: ScoreItem[] = [
  { label: "Compound Interest", score: null },
  { label: "FI Calculator", score: null },
  { label: "Savings Guard", score: null },
  { label: "Withdrawal Sustainability", score: null }
];

const readJson = (key: string) => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getScores = (): ScoreItem[] => {
  const compoundRaw = readJson("ofr-tool-compound");
  const fiRaw = readJson("ofr-tool-fi");
  const savingsRaw = readJson("ofr-tool-savings-guard");
  const withdrawalRaw = readJson("ofr-tool-withdrawal");

  const compound = compoundSchema.safeParse(compoundRaw);
  const fi = fiSchema.safeParse(fiRaw);
  const savings = savingsGuardSchema.safeParse(savingsRaw);
  const withdrawal = withdrawalSchema.safeParse(withdrawalRaw);

  return [
    {
      label: "Compound Interest",
      score: compound.success ? computeCompound(compound.data).disciplineScore : null
    },
    { label: "FI Calculator", score: fi.success ? computeFi(fi.data).disciplineScore : null },
    {
      label: "Savings Guard",
      score: savings.success ? computeSavingsGuard(savings.data).disciplineScore : null
    },
    {
      label: "Withdrawal Sustainability",
      score: withdrawal.success ? computeWithdrawal(withdrawal.data).disciplineScore : null
    }
  ];
};

export function ToolsProgress() {
  const [scores, setScores] = useState<ScoreItem[]>(emptyScores);

  const refresh = useCallback(() => {
    setScores(getScores());
  }, []);

  useEffect(() => {
    refresh();

    const onRefresh = () => refresh();
    window.addEventListener(TOOL_PROGRESS_EVENT, onRefresh);
    window.addEventListener("storage", onRefresh);

    return () => {
      window.removeEventListener(TOOL_PROGRESS_EVENT, onRefresh);
      window.removeEventListener("storage", onRefresh);
    };
  }, [refresh]);

  const completed = useMemo(
    () => scores.filter((item) => item.score !== null),
    [scores]
  );
  const completionRate = useMemo(
    () => Math.round((completed.length / Math.max(scores.length, 1)) * 100),
    [completed.length, scores.length]
  );
  const totalScore = useMemo(() => {
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, item) => sum + (item.score ?? 0), 0);
    return Math.round(total / completed.length);
  }, [completed]);
  const totalTools = scores.length;
  const remainingTools = Math.max(totalTools - completed.length, 0);

  const encouragement =
    completed.length === 0
      ? "Start with the first calculator to see your planning scale."
      : completed.length < totalTools
        ? `Good progress. Complete ${remainingTools} more calculators for a full scale view.`
        : totalScore >= 85
          ? "Thriving profile. Revisit these tools every quarter to protect momentum."
          : "Stable profile. Improve one recommendation per tool to move into Thriving.";

  const scaleLabel =
    totalScore < 60 ? "Improvement Needed" : totalScore < 85 ? "Stable" : "Thriving";

  return (
    <section className="card animate-fade-up p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">Calculator Progress</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slateBlue-700">
            Current Scale: {scaleLabel}
          </h2>
          <p className="mt-1 text-sm font-medium text-slateBlue-700">{totalScore}/100</p>
          <p className="mt-2 text-sm text-slateBlue-600">{encouragement}</p>
        </div>
        <p className="text-sm font-medium text-slateBlue-700">
          Completed: {completed.length}/{totalTools} tools
        </p>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slateBlue-100">
        <div
          className="h-2 rounded-full bg-calmGreen-600 transition-all duration-300"
          style={{ width: `${completionRate}%` }}
        />
      </div>

      <div className="ios-soft-panel mt-4 p-4 text-sm text-slateBlue-700">
        <p className="font-medium text-slateBlue-700">Scale guide</p>
        <ul className="mt-2 space-y-1 text-slateBlue-600">
          <li>• Improvement Needed: below 60</li>
          <li>• Stable: 60 to 84</li>
          <li>• Thriving: 85 and above</li>
          <li>• Each tool gives one next action to help you move up the scale.</li>
        </ul>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {scores.map((item) => (
          <div key={item.label} className="ios-soft-panel p-3">
            <p className="text-xs text-slateBlue-500">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-slateBlue-700">
              {item.score === null ? "Pending" : `${item.score}/100`}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
