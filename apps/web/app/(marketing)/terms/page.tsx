import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for OFR website, tools, and coaching content."
};

const updatedAt = "February 19, 2026";

export default function TermsPage() {
  return (
    <main className="page-shell py-12 sm:py-16">
      <article className="card animate-fade-up max-w-3xl space-y-5 p-7 sm:p-10">
        <h1 className="text-4xl font-semibold tracking-tight text-slateBlue-700">Terms</h1>
        <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">Last Updated: {updatedAt}</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">Acceptance of Terms</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            By accessing or using OFR, you agree to these Terms and our Privacy and Disclaimer
            pages. If you do not agree, do not use this site.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">Educational Services Only</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            OFR provides educational content and coaching frameworks. OFR is not acting as your
            investment adviser, broker, attorney, tax adviser, or fiduciary.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">No Warranty</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            The website, calculators, letters, and downloadable templates are provided &quot;as
            is&quot; and &quot;as available&quot; without warranties of any kind, including
            accuracy, completeness, fitness for a particular purpose, or non-infringement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">Limitation of Liability</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            To the maximum extent permitted by law, OFR and its operators are not liable for any
            indirect, incidental, consequential, special, exemplary, or punitive damages, or any
            loss of income, savings, data, or profits arising from use of the site or services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">User Responsibilities</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            You agree to provide accurate information, use the site lawfully, and not misuse tools,
            attempt unauthorized access, or interfere with platform operation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">Payments and Access</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            Paid features, pricing, and onboarding terms are shown on the website and may change.
            Access to paid services is provided after confirmed payment and may be suspended for
            misuse or policy violations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">Changes to Terms</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            We may update these Terms at any time by posting a revised version on this page. Your
            continued use after updates means you accept the revised Terms.
          </p>
        </section>

        <p className="text-sm leading-7 text-slateBlue-600">
          Questions:{" "}
          <a className="font-medium underline underline-offset-4" href="mailto:ourfinancialride@gmail.com">
            ourfinancialride@gmail.com
          </a>
        </p>
      </article>
    </main>
  );
}
