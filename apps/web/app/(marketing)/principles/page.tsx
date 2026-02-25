import type { Metadata } from "next";
import Link from "next/link";
import { philosophyRanked } from "../../../lib/content";

export const metadata: Metadata = {
  title: "Core Mission & Principles",
  description:
    "The OFR mission and ranked principles for calm, long-term wealth building."
};

export default function PrinciplesPage() {
  return (
    <main className="page-shell py-12 sm:py-16">
      <section className="card animate-fade-up p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-slateBlue-500">Core Mission</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">
          Build Wealth Without Noise
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slateBlue-500">
          We help families protect savings rate, simplify decisions, and build work-optional living with index-based discipline.
        </p>
      </section>

      <section className="card mt-10 animate-fade-up p-6 sm:p-8">
        <h2 className="section-title">Ranked Principles</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {philosophyRanked.map((item, index) => (
            <article key={item} className="ios-soft-panel p-4 text-sm text-slateBlue-700">
              <p className="text-xs tracking-wide text-slateBlue-500">#{index + 1}</p>
              <p className="box-copy mt-2">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-10">
        <Link href="/work-with-us#apply" className="ios-btn-primary px-5 py-3 text-sm">
          Apply for 1:1 Coaching
        </Link>
      </div>
    </main>
  );
}
