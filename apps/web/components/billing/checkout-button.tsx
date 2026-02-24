"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  className?: string;
  label?: string;
}

interface CheckoutResponse {
  url?: string;
  message?: string;
}

export function CheckoutButton({
  className = "button",
  label = "Unlock OFR Wealth System"
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ returnPath: "/courses/success" })
      });

      const payload = (await res.json()) as CheckoutResponse;

      if (!res.ok || !payload.url) {
        throw new Error(payload.message ?? "Unable to start checkout right now.");
      }

      window.location.href = payload.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-shell">
      <button className={className} onClick={() => void startCheckout()} disabled={loading}>
        {loading ? "Redirecting..." : label}
      </button>
      {error ? <p className="small text-danger">{error}</p> : null}
    </div>
  );
}
