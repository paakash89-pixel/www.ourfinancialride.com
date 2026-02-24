import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy policy for OFR website, applications, and member access."
};

const updatedAt = "February 19, 2026";

export default function PrivacyPage() {
  return (
    <main className="page-shell py-12 sm:py-16">
      <article className="card animate-fade-up max-w-3xl space-y-5 p-7 sm:p-10">
        <h1 className="text-4xl font-semibold tracking-tight text-slateBlue-700">Privacy</h1>
        <p className="text-xs uppercase tracking-[0.16em] text-slateBlue-500">Last Updated: {updatedAt}</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">What We Collect</h2>
          <ul className="list-disc space-y-1 pl-6 text-sm leading-7 text-slateBlue-600">
            <li>Application form data you submit (name, contact, goals, and fit details).</li>
            <li>Account details required for login-gated member access.</li>
            <li>Tool input values saved in your own browser localStorage for convenience.</li>
            <li>Technical logs needed for security, debugging, and abuse prevention.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">How We Use Data</h2>
          <ul className="list-disc space-y-1 pl-6 text-sm leading-7 text-slateBlue-600">
            <li>Evaluate applications and communicate onboarding next steps.</li>
            <li>Provide member access and deliver paid services.</li>
            <li>Improve product quality, reliability, and educational clarity.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">Data Sharing</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            We do not sell personal data. We only share information with service providers required
            to operate the website (for example, hosting or email delivery), subject to
            confidentiality and security obligations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">Storage and Security</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            Member sessions use httpOnly cookies. We apply reasonable technical and organizational
            measures to protect information, but no internet transmission or storage system is
            guaranteed to be fully secure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slateBlue-700">Your Choices</h2>
          <p className="text-sm leading-7 text-slateBlue-600">
            You may request correction or deletion of your submitted personal data by contacting us.
            LocalStorage data can be cleared directly in your browser at any time.
          </p>
        </section>

        <p className="text-sm leading-7 text-slateBlue-600">
          Privacy requests:{" "}
          <a className="font-medium underline underline-offset-4" href="mailto:ourfinancialride@gmail.com">
            ourfinancialride@gmail.com
          </a>
        </p>
      </article>
    </main>
  );
}
