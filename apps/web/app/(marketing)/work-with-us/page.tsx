import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationForm } from "../../../components/forms/application-form";
import { OnboardingWorkflow } from "../../../components/onboarding-workflow";
import { RegionPricingPanel } from "../../../components/region-pricing-panel";

export const metadata: Metadata = {
  title: "Work With Us",
  description:
    "Apply for OFR quarterly coaching for households in India and the US who want a simple, disciplined wealth plan."
};

const fitList = [
  "Household or individual income from India ₹25L+ or US $100k+",
  "NRIs planning a move but unsure how; we build a clear structure",
  "Ready to hold a 25-35% savings rate",
  "Open to index-based investing and clear rules",
  "Individuals can join solo; married applicants should include spouse in sessions"
];

const notFitList = [
  "Get-rich-quick mindset",
  "Trading, stock tips, or crypto expectations",
  "For married applicants: unwillingness to include spouse in planning and reviews"
];

const programStructure = [
  "Quarter 1: Safety, debt cleanup, and cashflow control",
  "Quarter 2: Tax-efficient investing and contribution plan",
  "Quarter 3: Goal funding, housing decisions, and withdrawals",
  "Quarter 4: Behavior system, annual review, and next-year plan"
];

export default function WorkWithUsPage() {
  return (
    <main className="page-shell py-12 sm:py-16">
      <section className="card animate-fade-up p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-slateBlue-500">Work With Us</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">
          Quarterly Coaching Program
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slateBlue-500">
          Founder cohort annual fee: ₹25,000 (India) or $1,000 (US) for 4 quarterly calls plus
          year-round implementation support.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="#apply"
            className="ios-btn-primary px-5 py-3 text-sm"
          >
            Apply
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="card animate-fade-up p-6">
          <h2 className="text-xl font-semibold text-slateBlue-700">Who It’s For</h2>
          <ul className="mt-4 space-y-2 text-sm text-slateBlue-600">
            {fitList.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
        <article className="card animate-fade-up p-6">
          <h2 className="text-xl font-semibold text-slateBlue-700">Who It’s Not For</h2>
          <ul className="mt-4 space-y-2 text-sm text-slateBlue-600">
            {notFitList.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card mt-10 animate-fade-up p-6 sm:p-8">
        <h2 className="section-title">Program Structure (4 Quarters)</h2>
        <ul className="mt-5 space-y-2 text-sm text-slateBlue-600">
          {programStructure.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <OnboardingWorkflow />
      </div>

      <div className="mt-10">
        <RegionPricingPanel showApply={false} />
      </div>

      <section className="card mt-10 animate-fade-up p-6 sm:p-8">
        <h2 className="section-title">Why Annual Coaching vs One-Off Calls</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <article className="ios-soft-panel p-4 text-sm text-slateBlue-600">
            <p className="text-xs uppercase tracking-wide text-slateBlue-500">One-off call</p>
            <p className="mt-2">Useful for a single decision, but no long-term accountability.</p>
          </article>
          <article className="ios-soft-panel p-4 text-sm text-slateBlue-600">
            <p className="text-xs uppercase tracking-wide text-slateBlue-500">Annual coaching</p>
            <p className="mt-2">
              We implement, review, and recalibrate every quarter so your system works through real life changes.
            </p>
          </article>
        </div>
      </section>

      <p className="mt-4 text-sm text-slateBlue-600">
        If it is not a fit after Quarter 1, we refund the annual fee minus the first session.
      </p>

      <section className="card mt-10 animate-fade-up p-6 sm:p-8">
        <h2 className="section-title">Questions?</h2>
        <p className="mt-2 text-sm text-slateBlue-600">
          Read the full FAQ for fit, pricing, and process details.
        </p>
        <div className="mt-4">
          <Link href="/faq" className="ios-btn-secondary px-5 py-3 text-sm">
            View FAQ
          </Link>
        </div>
      </section>

      <section id="apply" className="mt-10 scroll-mt-24">
        <h2 className="section-title">Apply</h2>
        <p className="section-subtitle">
          Fill out the form below. We will review fit and reply with next steps.
        </p>
        <div className="mt-5">
          <ApplicationForm />
        </div>
      </section>
    </main>
  );
}
