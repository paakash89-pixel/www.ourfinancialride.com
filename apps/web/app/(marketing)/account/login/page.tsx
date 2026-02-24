import type { Metadata } from "next";
import Link from "next/link";
import { AccountLoginForm } from "../../../../components/forms/account-login-form";

export const metadata: Metadata = {
  title: "Account Login",
  description: "Login to your OFR onboarding account."
};

interface AccountLoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

const resolveNextPath = (candidate: string | undefined): string => {
  if (!candidate || !candidate.startsWith("/")) {
    return "/account";
  }
  return candidate;
};

export default async function AccountLoginPage({ searchParams }: AccountLoginPageProps) {
  const resolved = await searchParams;
  const nextPath = resolveNextPath(resolved.next);

  return (
    <main className="page-shell py-14">
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-slateBlue-700">Account Login</h1>
        <p className="max-w-2xl text-sm leading-6 text-slateBlue-600">
          Use your account credentials created after application submission.
        </p>
      </section>
      <div className="mt-6">
        <AccountLoginForm nextPath={nextPath} />
      </div>
      <p className="mt-4 text-sm text-slateBlue-600">
        Need to create an account first?{" "}
        <Link href="/create-account" className="font-semibold text-slateBlue-700 underline underline-offset-4">
          Create account
        </Link>
        .
      </p>
    </main>
  );
}

