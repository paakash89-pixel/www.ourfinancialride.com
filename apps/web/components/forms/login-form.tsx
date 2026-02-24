"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(1, "Enter member password")
});

type Values = z.infer<typeof schema>;

export function LoginForm({ nextPath = "/member" }: { nextPath?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" }
  });

  const onSubmit = async (values: Values) => {
    setServerError(null);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      setServerError(payload.message ?? "Login failed.");
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <form className="card animate-fade-up max-w-md space-y-4 p-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <label className="text-sm font-medium text-slateBlue-700" htmlFor="member-password">
        Member password
      </label>
      <input
        id="member-password"
        type="password"
        autoComplete="current-password"
        {...register("password")}
        className="focus-ring w-full rounded-xl border border-slateBlue-200 px-3 py-2 text-sm"
      />
      {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
      {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="ios-btn-primary px-5 py-3 text-sm disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
