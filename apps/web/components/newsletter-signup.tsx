"use client";

import { useState } from "react";

interface NewsletterSignupProps {
  compact?: boolean;
}

export function NewsletterSignup({ compact = false }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@")) {
      return;
    }
    setStatus("success");
    setEmail("");
  };

  return (
    <form className={`ofr-newsletter-form${compact ? " compact" : ""}`} onSubmit={submit}>
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>
      <button className="button" type="submit">
        Subscribe
      </button>
      <p className="small">
        Weekly: one practical lesson, one calculator breakdown, zero hype.
      </p>
      {status === "success" ? (
        <p className="small" style={{ color: "#14663b" }}>
          You are subscribed. Welcome to calm wealth building.
        </p>
      ) : null}
    </form>
  );
}
