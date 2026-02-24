"use client";

import Link from "next/link";

const storyTimeline = [
  {
    year: "2014",
    title: "Started in California",
    detail:
      "Household income was low six figures. We chose systems before upgrades."
  },
  {
    year: "2018",
    title: "Moved to Colorado",
    detail:
      "We kept fixed costs steady and kept investing."
  },
  {
    year: "2024",
    title: "Income grew 4x in 10 years",
    detail:
      "Income rose, but the system stayed simple: automate and review quarterly."
  },
  {
    year: "2025",
    title: "Reached FI and moved to India",
    detail:
      "FI gave us options. We moved on our own timeline."
  }
];

const topMistakes = [
  "We did not start investing at 24.",
  "At 24, we leased a car we could not afford.",
  "Before our first home, we left saved income in a low-yield Bank of America savings account.",
  "On our first home, we put 25% down.",
  "Then we paid down a sub-4% mortgage too aggressively in the first two years.",
  "We did not understand capital gains taxes and got a surprise tax bill.",
  "During COVID, we bought a high-fee mutual fund chasing short-term gains.",
  "We owned 5 different cars in 14 years."
];

const whatWorked = [
  "We saved and invested 25%+ for 8+ years.",
  "We kept increasing income while protecting fixed costs.",
  "We built for Work Optional life, not status.",
  "We did not use financial advisors after learning this can stay simple."
];

export function StoryReel() {
  return (
    <section className="card mt-10 animate-fade-up p-6 sm:p-8">
      <h2 className="section-title">Our Story</h2>
      <p className="section-subtitle">
        From low six figures to FI in 10 years using simple systems.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          {storyTimeline.map((item, index) => (
            <article
              key={item.year}
              className="story-reveal ios-soft-panel box-copy p-4"
              style={{ animationDelay: `${120 * index}ms` }}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">{item.year}</p>
              <p className="mt-2 text-base font-semibold text-slateBlue-700">{item.title}</p>
              <p className="mt-1 text-sm text-slateBlue-600">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto flex w-full max-w-[220px] items-center justify-center">
          <div className="story-orb">
            <span className="story-orb-glow" />
            <span className="story-orb-text">OFR</span>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-slateBlue-600">
        We still enjoyed travel, coffee, and restaurants. We upgraded joy, not fixed costs.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <article className="ios-soft-panel p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">Top mistakes</p>
          <ul className="mt-3 space-y-2 text-sm text-slateBlue-700">
            {topMistakes.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
        <article className="ios-soft-panel p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">What we got right</p>
          <ul className="mt-3 space-y-2 text-sm text-slateBlue-700">
            {whatWorked.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="ios-soft-panel p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">Income Growth</p>
          <p className="mt-2 text-xl font-semibold text-slateBlue-700">4x in 10 years</p>
          <p className="mt-1 text-xs text-slateBlue-500">Without lifestyle inflation traps</p>
        </div>
        <div className="ios-soft-panel p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">Process</p>
          <p className="mt-2 text-xl font-semibold text-slateBlue-700">Simple + repeatable</p>
          <p className="mt-1 text-xs text-slateBlue-500">Automate every 2-4 weeks, review quarterly</p>
        </div>
        <div className="ios-soft-panel p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">Outcome</p>
          <p className="mt-2 text-xl font-semibold text-slateBlue-700">Work optional</p>
          <p className="mt-1 text-xs text-slateBlue-500">FI reached before relocating to India</p>
        </div>
      </div>

      <div className="ios-soft-panel mt-5 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-slateBlue-600">
          Want this system for your family? Apply for 1:1 coaching.
        </p>
        <Link href="/work-with-us#apply" className="ios-btn-primary px-4 py-2 text-sm">
          Apply for 1:1 Coaching
        </Link>
      </div>
    </section>
  );
}
