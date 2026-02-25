"use client";

import Link from "next/link";

export function RegionPricingPanel({
  showApply = true
}: {
  showApply?: boolean;
}) {
  return (
    <section className="card animate-fade-up p-6 sm:p-8">
      <h2 className="section-title">Pricing</h2>
      <p className="mt-2 text-sm text-slateBlue-500">
        Clear pricing for India and US families.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="ios-soft-panel p-4">
          <p className="text-xs uppercase tracking-wide text-slateBlue-500">Single Strategy Session (One-Off)</p>
          <p className="mt-2 text-2xl font-semibold text-slateBlue-700">₹5,000 / $100</p>
          <ul className="mt-3 space-y-1 text-xs text-slateBlue-600">
            <li>• One 60-minute strategy call</li>
            <li>• One decision reviewed deeply</li>
            <li>• No ongoing accountability</li>
          </ul>
        </div>
        <div className="ios-soft-panel p-4">
          <p className="text-xs uppercase tracking-wide text-slateBlue-500">Quarterly Coaching (Annual Fee)</p>
          <p className="mt-2 text-2xl font-semibold text-slateBlue-700">₹25,000 / $1,000</p>
          <ul className="mt-3 space-y-1 text-xs text-slateBlue-600">
            <li>• 4 quarterly 90-minute implementation calls</li>
            <li>• Full-year accountability and recalibration</li>
            <li>• Email support between calls</li>
            <li>• Couple alignment across major decisions</li>
          </ul>
          <p className="mt-2 text-xs text-slateBlue-600">Paid in 2 steps: ₹12,500 + ₹12,500 or $500 + $500.</p>
          <p className="mt-1 text-xs text-calmGreen-700">Founder cohort (first 10 families)</p>
        </div>
      </div>

      <div className="ios-soft-panel mt-5 p-4 text-sm text-slateBlue-600">
        <p>Free 20-minute intro call first.</p>
        <p className="mt-1">Individuals can join solo. Married applicants should include spouse.</p>
        <p className="mt-1">If accepted: 50% before call 1 and 50% after call 1.</p>
        <p className="mt-1">Payment methods: Google Pay or Apple Pay.</p>
        <p className="mt-1">Annual coaching is for implementation, not just information.</p>
      </div>

      {showApply ? (
        <div className="mt-5">
          <Link
            href="/work-with-us#apply"
            className="ios-btn-primary px-5 py-3 text-sm"
          >
            Apply
          </Link>
        </div>
      ) : null}
    </section>
  );
}
