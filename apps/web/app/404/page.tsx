import Link from "next/link";

export default function Custom404Page() {
  return (
    <main className="page-shell py-20">
      <section className="card mx-auto max-w-xl space-y-4 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slateBlue-500">404</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slateBlue-700">Page not found</h1>
        <p className="text-sm text-slateBlue-500">The page you requested does not exist.</p>
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="ios-btn-secondary px-4 py-2 text-sm"
          >
            Go Home
          </Link>
          <Link
            href="/work-with-us#apply"
            className="ios-btn-primary px-4 py-2 text-sm"
          >
            Apply
          </Link>
        </div>
      </section>
    </main>
  );
}
