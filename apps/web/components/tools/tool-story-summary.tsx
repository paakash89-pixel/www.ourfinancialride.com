"use client";

type ScaleBand = {
  label: string;
  toneClass: string;
  detail: string;
};

const getScaleBand = (score: number): ScaleBand => {
  if (score < 60) {
    return {
      label: "Improvement Needed",
      toneClass: "text-amber-700",
      detail: "Focus on one high-impact change."
    };
  }

  if (score < 85) {
    return {
      label: "Stable",
      toneClass: "text-slateBlue-700",
      detail: "Good base. Keep fixed costs and automation tight."
    };
  }

  return {
    label: "Thriving",
    toneClass: "text-calmGreen-700",
    detail: "System is strong. Stay consistent."
  };
};

export function ToolStorySummary({
  quickSummary,
  score,
  recommendation,
  details = []
}: {
  quickSummary: string;
  score: number;
  recommendation: string;
  details?: string[];
}) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const scale = getScaleBand(safeScore);

  return (
    <section className="ios-soft-panel p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <div className="mx-auto md:mx-0">
          <div className="story-orb story-orb-small">
            <span className="story-orb-glow" />
            <span className="story-orb-text text-xl">OFR</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">Summary</p>
          <p className="story-reveal box-copy text-sm font-medium text-slateBlue-700">{quickSummary}</p>

          {details.length > 0 ? (
            <ul className="space-y-1 text-sm text-slateBlue-600">
              {details.map((detail) => (
                <li key={detail}>• {detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slateBlue-100 bg-white/80 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">Scale</p>
        <div className="mt-3">
          <div className="relative h-2.5 overflow-hidden rounded-full bg-slateBlue-100">
            <span
              className="absolute inset-0 rounded-full opacity-35"
              style={{
                background:
                  "linear-gradient(90deg, rgba(100,210,255,0.45) 0%, rgba(10,132,255,0.35) 52%, rgba(48,209,88,0.42) 100%)"
              }}
            />
            <div
              className="relative h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${safeScore}%`,
                background: "linear-gradient(90deg, #64D2FF 0%, #0A84FF 52%, #30D158 100%)"
              }}
            />
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-[0_2px_8px_rgba(15,23,42,0.18)] transition-all duration-500"
              style={{
                left: `${safeScore}%`,
                background: "linear-gradient(180deg, #0A84FF 0%, #30D158 100%)"
              }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slateBlue-500">
            <span>Improvement Needed</span>
            <span>Stable</span>
            <span>Thriving</span>
          </div>
        </div>
        <p className={`mt-2 text-sm font-semibold ${scale.toneClass}`}>
          Current scale: {scale.label} ({safeScore}/100)
        </p>
        <p className="text-sm text-slateBlue-600">{scale.detail}</p>
        <p className="mt-2 text-sm font-semibold text-slateBlue-700">Next step: {recommendation}</p>
      </div>
    </section>
  );
}
