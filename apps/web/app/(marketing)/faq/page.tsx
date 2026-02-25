import type { Metadata } from "next";
import Link from "next/link";
import { workWithUsFaqs } from "../../../lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about OFR quarterly coaching, pricing, and fit."
};

export default function FaqPage() {
  return (
    <main className="page-shell py-12 sm:py-16">
      <section className="card animate-fade-up p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-slateBlue-500">FAQ</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">
          Common Questions
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slateBlue-500">
          Quick answers on fit, pricing, sessions, and how the process works.
        </p>
      </section>

      <section className="card mt-8 animate-fade-up p-6 sm:p-8">
        <div className="space-y-3">
          {workWithUsFaqs.map((faq) => (
            <article key={faq.question} className="ios-soft-panel p-4">
              <h2 className="text-base font-semibold text-slateBlue-700">{faq.question}</h2>
              <p className="mt-2 text-sm text-slateBlue-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="card animate-fade-up p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-slateBlue-700">Still have a question?</h2>
          <p className="mt-2 text-sm text-slateBlue-600">
            Apply and include your specific question in the form. We will respond with next steps.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/work-with-us#apply" className="ios-btn-primary px-5 py-3 text-sm">
              Apply
            </Link>
            <Link href="/work-with-us" className="ios-btn-secondary px-5 py-3 text-sm">
              Back to Work With Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
