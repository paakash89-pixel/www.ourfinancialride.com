import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment Coming Soon",
  description: "Payment flow details for founder cohort onboarding."
};

export default function PaymentComingSoonPage() {
  return (
    <main className="page-shell py-14">
      <section className="card animate-fade-up max-w-2xl p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slateBlue-700">Payment setup</h1>
        <p className="mt-3 text-sm leading-6 text-slateBlue-600">
          Payment is currently manual via Google Pay or Apple Pay.
        </p>

        <div className="ios-soft-panel mt-5 p-4 text-sm text-slateBlue-600">
          <p className="font-medium text-slateBlue-700">For Quarterly Coaching Program</p>
          <p className="mt-1">Annual fee covers all 4 quarterly calls.</p>
          <p className="mt-1">Free 20-minute intro call first.</p>
          <p className="mt-1">If accepted: 50% of annual fee before first call, 50% after first call.</p>
          <p className="mt-1">Payment methods: Google Pay or Apple Pay.</p>
        </div>

        <div className="mt-6">
          <Link
            href="/work-with-us#apply"
            className="ios-btn-primary px-5 py-3 text-sm"
          >
            Apply
          </Link>
        </div>
      </section>
    </main>
  );
}
