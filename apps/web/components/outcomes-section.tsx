import { wealthPriorityOrderQuarters } from "../lib/content";

export function OutcomesSection() {
  return (
    <section className="card animate-fade-up p-6 sm:p-8">
      <h2 className="section-title">Quarter-By-Quarter Outcomes</h2>
      <p className="section-subtitle">
        Every quarter has a clear teaching sequence and expected outcomes.
      </p>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {wealthPriorityOrderQuarters.map((bucket) => (
          <article key={bucket.label} className="ios-soft-panel box-copy p-4 text-sm text-slateBlue-700">
            <p className="font-semibold text-slateBlue-700">{bucket.label}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slateBlue-500">{bucket.focus}</p>
            <p className="mt-2 text-xs font-semibold text-slateBlue-600">
              Teaching order: {bucket.teachingOrder.join(" • ")}
            </p>
            <ul className="mt-2 space-y-1">
              {bucket.outcomes.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
