import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  accountCookieName,
  getAccountEmailFromSession,
  isAccountSessionValid
} from "../../../lib/member-auth";

export const metadata: Metadata = {
  title: "Account",
  description: "OFR onboarding account status and next actions."
};

const steps = [
  "Application submitted",
  "Account created and login active",
  "Free 20-minute intro call",
  "Acceptance confirmation",
  "Annual fee split: 50% before call 1 and 50% after call 1",
  "Quarterly sessions begin with implementation actions"
];

export default async function AccountPage() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(accountCookieName)?.value;

  if (!isAccountSessionValid(sessionValue)) {
    redirect("/account/login?next=/account");
  }

  const accountEmail = getAccountEmailFromSession(sessionValue);

  return (
    <main className="page-shell py-12 sm:py-16">
      <section className="card animate-fade-up p-7 sm:p-10">
        <h1 className="text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">
          Account Status
        </h1>
        <p className="mt-3 text-sm text-slateBlue-600">
          Logged in as <span className="font-semibold text-slateBlue-700">{accountEmail ?? "account user"}</span>.
        </p>

        <div className="ios-soft-panel mt-6 p-4 text-sm text-slateBlue-700">
          <p className="font-medium text-slateBlue-700">Workflow</p>
          <ol className="mt-3 space-y-2 text-slateBlue-600">
            {steps.map((step, index) => (
              <li key={step}>
                {index + 1}. {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/work-with-us#apply" className="ios-btn-primary px-5 py-3 text-sm">
            Go to application
          </Link>
          <Link href="/work-with-us/payment-coming-soon" className="ios-btn-secondary px-5 py-3 text-sm">
            Payment details
          </Link>
        </div>
      </section>
    </main>
  );
}
