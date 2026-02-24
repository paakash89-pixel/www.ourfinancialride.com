import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Educational disclaimer for OFR content, tools, and coaching."
};

const updatedAt = "February 19, 2026";

export default function DisclaimerPage() {
  return (
    <main className="page-shell py-12 sm:py-16">
      <article className="card animate-fade-up max-w-3xl space-y-5 p-7 sm:p-10">
        <h1 className="text-4xl font-semibold tracking-tight text-slateBlue-700">Disclaimer</h1>
        <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">Last Updated: {updatedAt}</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">Educational Use Only</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            OFR provides financial education and planning frameworks only. Nothing on this website,
            in the tools, in letters, or in sessions is investment, legal, tax, accounting, or
            other professional advice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">No Personalized Investment Advice</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            OFR does not provide stock tips, crypto calls, market timing signals, or discretionary
            portfolio management. You remain solely responsible for all financial decisions and
            should consult licensed professionals before acting.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">Model and Calculator Limitations</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            All tools use simplified assumptions and are scenario models, not forecasts or
            guarantees. Actual outcomes may differ materially due to market conditions, taxes, fees,
            inflation, behavior, policy changes, and personal circumstances.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">No Guarantee of Results</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            Past outcomes, examples, case studies, and testimonials do not guarantee future results.
            Any projected timeline to financial independence is illustrative only.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">Use at Your Own Risk</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            To the maximum extent permitted by law, OFR disclaims liability for losses, damages, or
            claims arising from reliance on website content, tools, downloads, or session materials.
          </p>
        </section>

        <p className="text-sm leading-7 text-slateBlue-600">
          Questions: <a className="font-medium underline underline-offset-4" href="mailto:ourfinancialride@gmail.com">ourfinancialride@gmail.com</a>
        </p>
      </article>
    </main>
  );
}
