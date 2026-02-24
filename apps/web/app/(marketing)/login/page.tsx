import type { Metadata } from "next";
import { LoginForm } from "../../../components/forms/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Secure login for owner member review access."
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolved = await searchParams;
  const nextPath = resolved.next ?? "/member";

  return (
    <main className="page-shell py-14">
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-slateBlue-700">Member Login</h1>
        <p className="max-w-2xl text-sm leading-6 text-slateBlue-500">
          Private owner access for internal review pages.
        </p>
      </section>
      <div className="mt-6">
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
