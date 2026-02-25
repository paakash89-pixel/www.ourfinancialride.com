import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "Feedback from current OFR coaching clients across India, the US, and NRI families."
};

const testimonials = [
  {
    quote:
      "We were earning well but still felt fragile. After two quarters, we had one clear system and fewer money arguments.",
    byline: "Current client, Bengaluru"
  },
  {
    quote:
      "We were planning a US-to-India move for years. OFR gave us a sequence, timeline, and confidence to execute.",
    byline: "Current NRI client, Seattle"
  },
  {
    quote:
      "The quarterly format worked for us. Every call led to specific actions and measurable progress by the next review.",
    byline: "Current client, Hyderabad"
  },
  {
    quote:
      "The biggest shift was behavioral. We stopped reacting to news and started following our written rules.",
    byline: "Current client, Austin"
  }
];

export default function TestimonialsPage() {
  return (
    <main className="page-shell py-12 sm:py-16">
      <section className="card animate-fade-up p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-slateBlue-500">Testimonials</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">
          What Clients Say
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slateBlue-500">
          Feedback from current clients on structure, clarity, and consistent execution.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {testimonials.map((item) => (
          <article key={item.quote} className="card animate-fade-up p-6">
            <p className="box-copy text-sm text-slateBlue-700">“{item.quote}”</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-slateBlue-500">{item.byline}</p>
          </article>
        ))}
      </section>

      <div className="mt-10">
        <Link href="/work-with-us#apply" className="ios-btn-primary px-5 py-3 text-sm">
          Apply for 1:1 Coaching
        </Link>
      </div>
    </main>
  );
}
