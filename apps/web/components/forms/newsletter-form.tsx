"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email")
});

type NewsletterValues = z.infer<typeof newsletterSchema>;

const STORAGE_KEY = "ofr-newsletter-emails";

export function NewsletterForm({
  subdued = false,
  nextPath,
  submitLabel = "Get the monthly letter"
}: {
  subdued?: boolean;
  nextPath?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" }
  });

  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timeout);
  }, [success]);

  const onSubmit = async (values: NewsletterValues) => {
    setServerError(null);

    const response = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      setServerError(payload.message ?? "Unable to subscribe right now.");
      return;
    }

    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const list: NewsletterValues[] = raw ? JSON.parse(raw) : [];
      list.push(values);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    if (nextPath) {
      router.push(nextPath);
      router.refresh();
      return;
    }

    reset();
    setSuccess("You are subscribed to the monthly letter.");
  };

  return (
    <form
      className={`ios-soft-panel space-y-2 p-4 ${subdued ? "bg-white/70" : "bg-white/80"}`}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <label htmlFor="newsletter-email" className="text-sm font-medium text-slateBlue-700">
        Email
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          className="focus-ring w-full rounded-xl border border-slateBlue-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="ios-btn-secondary px-4 py-2 text-sm"
        >
          {submitLabel}
        </button>
      </div>
      {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
      {serverError ? <p className="text-xs text-red-600">{serverError}</p> : null}
      {success ? <p className="text-xs text-calmGreen-700">{success}</p> : null}
    </form>
  );
}
