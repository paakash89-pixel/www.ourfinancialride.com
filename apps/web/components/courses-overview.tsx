"use client";

import Link from "next/link";
import { CheckoutButton } from "./billing/checkout-button";
import { useAuth } from "./auth-provider";

const freeModules = [
  "Money operating system: account structure and automation",
  "Budget basics: needs vs wants without guilt",
  "Index investing foundations for India + US",
  "FI number and withdrawal primer",
  "Starter checklists"
];

const paidModules = [
  "Premium templates for yearly financial planning",
  "Wealth dashboard setup and update workflow",
  "Quarterly review process for couples/families",
  "Withdrawal modeling with stress-test scenarios",
  "Premium calculators: SIP/SWP and US 401(k)+Roth simulator"
];

export function CoursesOverview() {
  const { user, premium, loading } = useAuth();

  return (
    <div className="ofr-course-grid">
      <article className="ofr-card">
        <p className="pill">Free Course</p>
        <h2>Calm Wealth Foundations</h2>
        <p className="ofr-muted">Video + text + checklists. Start immediately.</p>
        <ul className="plain-list">
          {freeModules.map((module) => (
            <li key={module}>{module}</li>
          ))}
        </ul>
        <Link href="/tools" className="button">
          Start Free Learning
        </Link>
      </article>

      <article className="ofr-card">
        <p className="pill">Paid Course</p>
        <h2>OFR Wealth System</h2>
        <p className="ofr-muted">
          Premium system for households building long-term wealth with high process discipline.
        </p>

        <ul className="plain-list">
          {paidModules.map((module) => (
            <li key={module}>{module}</li>
          ))}
        </ul>

        <div className="ofr-status-box">
          <span className="small">Access status</span>
          <strong>
            {loading
              ? "Checking..."
              : premium
                ? "Premium active"
                : user
                  ? "Logged in, not premium"
                  : "Login required"}
          </strong>
          {!user && !loading ? (
            <Link href="/login" className="button ghost">
              Login to Continue
            </Link>
          ) : null}
          {user && !premium && !loading ? <CheckoutButton /> : null}
          {premium && !loading ? (
            <>
              <Link href="/tools" className="button">
                Open Premium Tools
              </Link>
              <p className="small">
                Premium access is currently mirrored locally after successful checkout. For production, sync Stripe webhooks to Firebase custom claims.
              </p>
            </>
          ) : null}
        </div>
      </article>
    </div>
  );
}
