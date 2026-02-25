import type { Metadata } from "next";
import Link from "next/link";
import { getAllLetters } from "../../lib/letters";

export const metadata: Metadata = {
  title: "Build Time Freedom Without Noise",
  description:
    "For households earning ₹25L+ (India) or $100k+ (US), OFR helps build work-optional living in 8-10 years."
};

const whoFor = [
  "India households ₹25L+ and US households $100k+",
  "Families, individuals, and serious professionals",
  "NRIs planning a move but unsure how; we build a clear structure",
  "Ready to save 25%+ after-tax",
  "Calm systems over hype"
];

const whoNotFor = [
  "Get-rich-quick mindset",
  "Trading or crypto focus",
  "Married applicants unwilling to include their spouse"
];

const toolsPreview = [
  {
    title: "Compound Interest Calculator",
    summary: "Track growth with and without inflation."
  },
  {
    title: "FI Calculator + Scenarios",
    summary: "See your FI target and timeline."
  },
  {
    title: "Savings Rate Guard",
    summary: "Catch lifestyle creep early."
  },
  {
    title: "Withdrawal Sustainability",
    summary: "Test if withdrawals can last."
  }
];

export default async function HomePage() {
  const letters = (await getAllLetters()).slice(0, 3);

  return (
    <main className="page-shell py-12 sm:py-16">
      <section className="card animate-fade-up space-y-6 p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-slateBlue-500">OFR — Our Financial Ride</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">
          Build Time Freedom Without Noise.
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slateBlue-500">
          For families and serious professionals earning ₹25L+ (India) or $100k+ (US).
          We build a simple, disciplined plan so work can become optional in 8-10 years.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/work-with-us#apply"
            className="ios-btn-primary px-5 py-3 text-sm"
          >
            Apply for 1:1 Coaching
          </Link>
          <Link
            href="/tools"
            className="ios-btn-secondary px-5 py-3 text-sm"
          >
            Use Free Tools
          </Link>
        </div>
        <p className="text-sm text-slateBlue-500">
          Free 20-minute intro call before any paid plan.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <article className="card animate-fade-up p-6">
          <h2 className="text-xl font-semibold text-slateBlue-700">Who This Is For</h2>
          <ul className="mt-4 space-y-2 text-sm text-slateBlue-600">
            {whoFor.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
        <article className="card animate-fade-up p-6">
          <h2 className="text-xl font-semibold text-slateBlue-700">Who This Is NOT For</h2>
          <ul className="mt-4 space-y-2 text-sm text-slateBlue-600">
            {whoNotFor.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <article className="card animate-fade-up p-6">
          <h2 className="text-xl font-semibold text-slateBlue-700">Our Story</h2>
          <p className="box-copy mt-3 text-sm text-slateBlue-600">
            Our full journey, mistakes, and what actually worked.
          </p>
          <Link href="/our-story" className="mt-4 inline-flex text-sm font-medium text-slateBlue-700 underline underline-offset-4">
            Open Our Story
          </Link>
        </article>
        <article className="card animate-fade-up p-6">
          <h2 className="text-xl font-semibold text-slateBlue-700">Core Mission & Principles</h2>
          <p className="box-copy mt-3 text-sm text-slateBlue-600">
            The OFR operating principles we teach and apply every quarter.
          </p>
          <Link href="/principles" className="mt-4 inline-flex text-sm font-medium text-slateBlue-700 underline underline-offset-4">
            Open Principles
          </Link>
        </article>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <article className="card animate-fade-up p-6">
          <h2 className="text-xl font-semibold text-slateBlue-700">Client Feedback</h2>
          <p className="box-copy mt-3 text-sm text-slateBlue-600">
            Real comments from current coaching clients.
          </p>
          <Link href="/testimonials" className="mt-4 inline-flex text-sm font-medium text-slateBlue-700 underline underline-offset-4">
            Read Testimonials
          </Link>
        </article>
        <article className="card animate-fade-up p-6">
          <h2 className="text-xl font-semibold text-slateBlue-700">Contact Us</h2>
          <p className="box-copy mt-3 text-sm text-slateBlue-600">
            Reach out directly for fit questions before you apply.
          </p>
          <Link href="/contact" className="mt-4 inline-flex text-sm font-medium text-slateBlue-700 underline underline-offset-4">
            Open Contact
          </Link>
        </article>
      </section>

      <section className="card mt-10 animate-fade-up p-6 sm:p-8">
        <h2 className="section-title">Tools Preview</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {toolsPreview.map((tool) => (
            <article key={tool.title} className="ios-soft-panel p-4">
              <h3 className="text-base font-semibold text-slateBlue-700">{tool.title}</h3>
              <p className="box-copy mt-2 text-sm text-slateBlue-600">{tool.summary}</p>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <Link href="/tools" className="font-medium text-slateBlue-700 underline underline-offset-4">
                  Try tool
                </Link>
                <Link href="/work-with-us#apply" className="text-slateBlue-500 underline underline-offset-4">
                  Apply
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card mt-10 animate-fade-up p-6 sm:p-8">
        <h2 className="section-title">Letters</h2>
        <p className="mt-2 text-sm text-slateBlue-500">
          Practical notes on long-term wealth building for India and US families.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {letters.map((letter) => (
            <article key={letter.slug} className="ios-soft-panel p-4">
              <h3 className="text-base font-semibold text-slateBlue-700">{letter.title}</h3>
              <p className="box-copy mt-2 text-sm text-slateBlue-600">{letter.summary}</p>
              <Link
                href={`/letters/${letter.slug}`}
                className="mt-4 inline-flex text-sm font-medium text-slateBlue-700 underline underline-offset-4"
              >
                Read letter
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-5">
          <Link href="/letters" className="ios-btn-secondary px-5 py-3 text-sm">
            View all letters
          </Link>
        </div>
      </section>
    </main>
  );
}
