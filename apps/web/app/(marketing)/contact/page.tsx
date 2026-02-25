import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact OFR for calm, rational wealth coaching for India, US, and NRI households."
};

export default function ContactPage() {
  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "ourfinancialride@gmail.com";
  const instagramUrl =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/ourfinancialride";
  const threadsUrl =
    process.env.NEXT_PUBLIC_THREADS_URL ?? "https://www.threads.net/@ourfinancialride";

  return (
    <main className="page-shell py-12 sm:py-16">
      <section className="card animate-fade-up p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-slateBlue-500">Contact Us</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">
          Calm Wealth Coaching for India, US, and NRI Households
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slateBlue-500">
          If you want structure, clarity, and disciplined long-term execution, email us directly.
        </p>

        <div className="mt-6 space-y-3 text-sm">
          <p className="text-slateBlue-600">
            Email:{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="font-medium text-slateBlue-700 underline underline-offset-4"
            >
              {contactEmail}
            </a>
          </p>
          <div className="flex flex-wrap gap-3 text-slateBlue-600">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slateBlue-700 underline underline-offset-4"
            >
              Instagram
            </a>
            <a
              href={threadsUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slateBlue-700 underline underline-offset-4"
            >
              Threads
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
