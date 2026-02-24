import Link from "next/link";

export function CalculatorCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card animate-fade-up space-y-5 p-5 sm:p-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-slateBlue-700">{title}</h2>
        <p className="text-sm text-slateBlue-500">{description}</p>
      </div>
      {children}
      <div className="ios-soft-panel p-4 text-sm text-slateBlue-600">
        Want us to personalize this?{" "}
        <Link href="/work-with-us#apply" className="font-semibold text-slateBlue-700 underline underline-offset-4">
          Apply.
        </Link>
      </div>
    </section>
  );
}
