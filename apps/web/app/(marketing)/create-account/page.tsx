import type { Metadata } from "next";
import { AccountCreateForm } from "../../../components/forms/account-create-form";
import { OnboardingWorkflow } from "../../../components/onboarding-workflow";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your OFR account after application."
};

const resolveNextPath = (candidate: string | undefined): string => {
  if (!candidate || !candidate.startsWith("/")) {
    return "/account";
  }
  return candidate;
};

interface CreateAccountPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function CreateAccountPage({ searchParams }: CreateAccountPageProps) {
  const resolved = await searchParams;
  const nextPath = resolveNextPath(resolved.next);

  return (
    <main className="page-shell py-14">
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-slateBlue-700">Create your OFR account</h1>
        <p className="max-w-2xl text-sm leading-6 text-slateBlue-600">
          Create your account profile in one step.
        </p>
      </section>

      <div className="mt-6">
        <AccountCreateForm nextPath={nextPath} />
      </div>

      <div className="mt-10">
        <OnboardingWorkflow />
      </div>
    </main>
  );
}
