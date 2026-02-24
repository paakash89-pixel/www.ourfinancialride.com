const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "ourfinancialride@gmail.com";

const steps = [
  {
    title: "1. Submit the application form",
    detail: "Apply as an individual or couple."
  },
  {
    title: "2. Intro call and acceptance",
    detail: "Take a free 20-minute intro call. If accepted, we confirm scope."
  },
  {
    title: "3. Payment",
    detail: "Pay 50% before call 1 and 50% after call 1 via Google Pay or Apple Pay."
  },
  {
    title: "4. Quarterly implementation",
    detail: "4 calls per year, 90 minutes each, with clear actions between calls."
  },
  {
    title: "5. Ongoing support",
    detail: "Email support between calls plus a short action list after each session."
  }
];

export function OnboardingWorkflow() {
  return (
    <section className="card animate-fade-up p-6 sm:p-8">
      <h2 className="section-title">Full Workflow</h2>
      <p className="section-subtitle">
        Simple path from application to implementation.
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {steps.map((step) => (
          <article key={step.title} className="ios-soft-panel p-4">
            <h3 className="text-base font-semibold text-slateBlue-700">{step.title}</h3>
            <p className="box-copy mt-2 text-sm text-slateBlue-600">{step.detail}</p>
          </article>
        ))}
      </div>

      <div className="ios-soft-panel mt-4 p-4 text-sm text-slateBlue-700">
        Questions before applying? Email{" "}
        <a className="font-medium underline underline-offset-4" href={`mailto:${contactEmail}`}>
          {contactEmail}
        </a>
        .
      </div>
    </section>
  );
}
