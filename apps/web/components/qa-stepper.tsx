"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FLOW_STEPS = [
  {
    id: 1,
    label: "Write Plan",
    help: "Set your long-term rule",
    href: "/app/pcc"
  },
  {
    id: 2,
    label: "Start Pause",
    help: "Begin the 60-second calm timer",
    href: "/app/sell"
  },
  {
    id: 3,
    label: "Save Decision",
    help: "Choose Held or Panic Sold",
    href: "/app/sell"
  },
  {
    id: 4,
    label: "See Lesson",
    help: "Review what panic could have cost",
    href: "/app/regret"
  }
] as const;

const activeStepFromPath = (pathname: string): number => {
  if (pathname.startsWith("/app/regret")) return 4;
  if (pathname.startsWith("/app/sell")) return 2;
  if (pathname.startsWith("/app/pcc")) return 1;
  return 1;
};

export function QaStepper() {
  const pathname = usePathname();
  const activeStep = activeStepFromPath(pathname);

  return (
    <div className="qa-stepper" aria-label="Guided steps">
      {FLOW_STEPS.map((step) => {
        const isActive = step.id === activeStep;
        const isVisited = step.id < activeStep;
        return (
          <Link
            key={step.id}
            href={step.href}
            className={`qa-step${isActive ? " active" : ""}${isVisited ? " visited" : ""}`}
          >
            <span className="qa-step-index">Step {step.id}</span>
            <strong>{step.label}</strong>
            <span className="small">{step.help}</span>
          </Link>
        );
      })}
    </div>
  );
}
