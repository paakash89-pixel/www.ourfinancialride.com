"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/\d/, "Include at least one number"),
  confirmPassword: z.string().min(1, "Confirm your password"),
  subscribeNewsletter: z.boolean()
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type Values = z.infer<typeof schema>;

const fieldClassName =
  "focus-ring mt-1 w-full rounded-xl border border-slateBlue-200 bg-white px-3 py-2 text-sm";

export function AccountCreateForm({ nextPath = "/account" }: { nextPath?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      subscribeNewsletter: true
    }
  });

  const onSubmit = async (values: Values) => {
    setServerError(null);

    const response = await fetch("/api/account/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      setServerError(payload.message ?? "Unable to create account.");
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <form className="card animate-fade-up max-w-xl space-y-4 p-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Full name" error={errors.fullName?.message}>
        <input {...register("fullName")} className={fieldClassName} />
      </Field>

      <Field label="Email" error={errors.email?.message}>
        <input type="email" {...register("email")} className={fieldClassName} />
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <input type="password" autoComplete="new-password" {...register("password")} className={fieldClassName} />
      </Field>

      <Field label="Confirm password" error={errors.confirmPassword?.message}>
        <input
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          className={fieldClassName}
        />
      </Field>

      <label className="ios-soft-panel flex items-start gap-3 p-3 text-sm text-slateBlue-700">
        <input
          type="checkbox"
          {...register("subscribeNewsletter")}
          className="focus-ring mt-1 h-4 w-4 rounded border-slateBlue-300"
        />
        <span>
          Sign me up for the OFR newsletter for monthly letters and practical wealth notes.
        </span>
      </label>

      {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

      <button type="submit" disabled={isSubmitting} className="ios-btn-primary px-5 py-3 text-sm disabled:opacity-60">
        {isSubmitting ? "Creating account..." : "Create account and continue"}
      </button>

      <p className="text-xs text-slateBlue-500">
        Already created an account? Use{" "}
        <a href="/account/login" className="font-semibold text-slateBlue-700 underline underline-offset-4">
          account login
        </a>
        .
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slateBlue-700">
      {label}
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
