import type { Metadata } from "next";
import Link from "next/link";
import { getAllLetters } from "../../../lib/letters";

export const metadata: Metadata = {
  title: "Letters",
  description:
    "Read OFR letters on index investing, financial independence, lifestyle inflation, and disciplined wealth building for India and US families."
};

export default async function LettersPage() {
  const letters = await getAllLetters();

  return (
    <main className="page-shell py-12 sm:py-16">
      <section className="card animate-fade-up p-7 sm:p-10">
        <h1 className="text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">
          Letters
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slateBlue-500">
          Field notes on index investing, savings-rate protection, buy-vs-rent decisions, and
          financial independence systems for families in India and the US.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        {letters.map((letter) => (
          <article key={letter.slug} className="card animate-fade-up p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slateBlue-700">{letter.title}</h2>
            <p className="mt-3 text-sm text-slateBlue-600">{letter.summary}</p>
            {letter.keywords && letter.keywords.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {letter.keywords.slice(0, 3).map((keyword) => (
                  <span key={keyword} className="ios-chip">
                    {keyword}
                  </span>
                ))}
              </div>
            ) : null}
            <Link
              href={`/letters/${letter.slug}`}
              className="ios-btn-secondary mt-4 px-4 py-2 text-sm"
            >
              Read letter
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
