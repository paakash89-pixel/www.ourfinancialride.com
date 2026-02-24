"use client";

import { useMemo, useState } from "react";
import { PRICING_BY_REGION, type Region } from "@intrinsic/shared";

export function PricingClient() {
  const [region, setRegion] = useState<Region>("US");

  const price = useMemo(() => PRICING_BY_REGION[region], [region]);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className={`button ${region === "US" ? "" : "secondary"}`}
          onClick={() => setRegion("US")}
        >
          United States
        </button>
        <button
          className={`button ${region === "IN" ? "" : "secondary"}`}
          onClick={() => setRegion("IN")}
        >
          India
        </button>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Explorer (Free)</h3>
          <ul className="plain-list">
            <li>Owned/PCC limit: 3</li>
            <li>Full Stress Mode</li>
            <li>Sell Friction flow + cooldown</li>
            <li>Discipline Score + Hold Streak</li>
            <li>Regret Ledger view</li>
          </ul>
        </div>
        <div className="card">
          <h3>Owner (Pro via RevenueCat entitlement)</h3>
          <p className="kpi">{price.monthlyDisplay}</p>
          <p>{price.yearlyDisplay}</p>
          <ul className="plain-list">
            <li>Unlimited PCC / Owned tracking</li>
            <li>Advanced regret analytics + export</li>
            <li>Priority support</li>
            <li>All Explorer behavior features included</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
