"use client";

import { regionLabel, type Region } from "../lib/region";
import { useRegion } from "./region-provider";

export function RegionToggle() {
  const { region, setRegion } = useRegion();

  return (
    <div className="inline-flex items-center rounded-full border border-slateBlue-200 bg-slateBlue-50/70 p-1" role="group" aria-label="Region selector">
      {(["IN", "US"] as Region[]).map((option) => {
        const active = region === option;
        return (
          <button
            type="button"
            key={option}
            onClick={() => setRegion(option)}
            className={`focus-ring rounded-full px-3 py-1 text-xs font-medium transition ${
              active
                ? "bg-white text-slateBlue-700 shadow-sm"
                : "text-slateBlue-500 hover:bg-white/70"
            }`}
            aria-pressed={active}
          >
            {regionLabel[option]}
          </button>
        );
      })}
    </div>
  );
}
