import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "../../../components/forms/newsletter-form";
import { getAllLetters } from "../../../lib/letters";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Secondary OFR newsletter signup: one monthly letter for calm, disciplined wealth building."
};

export default async function NewsletterPage() {
  const letters = await getAllLetters();

  return (
    <main className="page-shell py-12 sm:py-16">
      <section className="card animate-fade-up max-w-3xl p-7 sm:p-10">
        <h1 className="text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">Newsletter</h1>
        <p className="mt-4 text-base leading-7 text-slateBlue-500">
          One monthly letter on disciplined investing and time freedom design.
        </p>
        <div className="mt-5 max-w-lg">
          <NewsletterForm subdued />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slateBlue-700">Archive</h2>
        <div className="mt-4 grid gap-3">
          {letters.map((letter) => (
            <article key={letter.slug} className="card p-4">
              <h3 className="text-base font-semibold text-slateBlue-700">{letter.title}</h3>
              <p className="mt-1 text-sm text-slateBlue-500">{letter.summary}</p>
              <Link
                href={`/letters/${letter.slug}`}
                className="focus-ring mt-3 inline-flex text-sm font-medium text-slateBlue-700 underline underline-offset-4"
              >
                Read
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
