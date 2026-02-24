"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  applicationSchema,
  incomeOptions,
  locationOptions,
  portfolioOptions,
  savingsRateOptions,
  type ApplicationRecord,
  type ApplicationValues
} from "../../lib/application-schema";

const STORAGE_KEY = "ofr-application-backups";
const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "ourfinancialride@gmail.com";

interface SubmitResponse {
  ok: boolean;
  record: ApplicationRecord;
}

const defaultValues: ApplicationValues = {
  spouse1Name: "",
  spouse2Name: "",
  email: "",
  phone: "",
  location: "India",
  incomeRange: "₹25L–₹1Cr",
  currentSavingsRate: "10–20",
  portfolioRange: "<₹25L",
  biggestGoal: "",
  biggestWorry: "",
  spouseAttendanceConfirmed: false
};

const fieldClassName =
  "focus-ring mt-1 w-full rounded-xl border border-slateBlue-200 bg-white px-3 py-2 text-sm text-slateBlue-700";

export function ApplicationForm() {
  const [submitted, setSubmitted] = useState<ApplicationRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues
  });

  const incomeRange = watch("incomeRange");

  const emailDraft = useMemo(() => {
    if (!submitted) return "";
    const spouse2 = submitted.spouse2Name?.trim() || "Not provided (individual application)";
    const participants = submitted.spouse2Name?.trim()
      ? `${submitted.spouse1Name} + ${submitted.spouse2Name}`
      : submitted.spouse1Name;

    return [
      `Subject: OFR Application - ${participants}`,
      "",
      `Spouse 1: ${submitted.spouse1Name}`,
      `Spouse 2 / Partner: ${spouse2}`,
      `Email: ${submitted.email}`,
      `Phone/WhatsApp: ${submitted.phone || "N/A"}`,
      `Location: ${submitted.location}`,
      `Income Range: ${submitted.incomeRange}`,
      `Current Savings Rate: ${submitted.currentSavingsRate}`,
      `Portfolio Range: ${submitted.portfolioRange}`,
      "",
      `Biggest Goal: ${submitted.biggestGoal}`,
      "",
      `Biggest Worry: ${submitted.biggestWorry}`,
      "",
      `Fit: ${submitted.fit}`,
      `Submitted At: ${submitted.submittedAt}`,
      "",
      "Please share next steps for the OFR coaching program."
    ].join("\n");
  }, [submitted]);

  const mailtoLink = useMemo(() => {
    if (!submitted) return "#";
    const participants = submitted.spouse2Name?.trim()
      ? `${submitted.spouse1Name} + ${submitted.spouse2Name}`
      : submitted.spouse1Name;
    const subject = encodeURIComponent(
      `OFR Application - ${participants}`
    );
    const body = encodeURIComponent(emailDraft.split("\n").slice(2).join("\n"));
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }, [emailDraft, submitted]);

  const onSubmit = async (values: ApplicationValues) => {
    setSubmitError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      const payload = (await response.json()) as SubmitResponse & { message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Application failed. Please retry.");
      }

      setSubmitted(payload.record);

      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const list: ApplicationRecord[] = raw ? JSON.parse(raw) : [];
        list.push(payload.record);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed.");
    }
  };

  const downloadJson = () => {
    if (!submitted) return;
    const blob = new Blob([JSON.stringify(submitted, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ofr-application-${submitted.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyEmail = async () => {
    if (!emailDraft) return;
    try {
      await navigator.clipboard.writeText(emailDraft);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (submitted) {
    return (
      <div className="card animate-fade-up p-6">
        <h3 className="text-xl font-semibold text-slateBlue-700">Application received</h3>
        <p className="mt-2 text-sm text-slateBlue-500">We will respond with next steps.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Spouse 1" value={submitted.spouse1Name} />
          <SummaryItem label="Spouse 2 / Partner" value={submitted.spouse2Name?.trim() || "Individual application"} />
          <SummaryItem label="Email" value={submitted.email} />
          <SummaryItem label="Location" value={submitted.location} />
          <SummaryItem label="Income" value={submitted.incomeRange} />
          <SummaryItem label="Savings Rate" value={submitted.currentSavingsRate} />
          <SummaryItem label="Portfolio" value={submitted.portfolioRange} />
          <SummaryItem label="Fit" value={submitted.fit === "in-fit" ? "Likely fit" : "Needs review"} />
        </div>

        <div className="ios-soft-panel mt-5 space-y-2 p-4 text-sm text-slateBlue-600">
          <p className="font-medium text-slateBlue-700">Biggest Goal</p>
          <p>{submitted.biggestGoal}</p>
          <p className="pt-2 font-medium text-slateBlue-700">Biggest Worry</p>
          <p>{submitted.biggestWorry}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyEmail}
            className="ios-btn-primary px-4 py-2 text-sm"
          >
            Copy this email to send
          </button>
          <a
            href={mailtoLink}
            className="ios-btn-secondary px-4 py-2 text-sm"
          >
            Open email draft
          </a>
          <button
            type="button"
            onClick={downloadJson}
            className="ios-btn-secondary px-4 py-2 text-sm"
          >
            Download your application JSON
          </button>
        </div>

        <div className="ios-soft-panel mt-5 space-y-2 p-4 text-sm text-slateBlue-700">
          <p className="font-medium text-slateBlue-700">Next step in workflow</p>
          <p>We will contact you for the free 20-minute intro call and acceptance decision.</p>
        </div>

        {copied ? <p className="mt-2 text-xs text-calmGreen-700">Email draft copied.</p> : null}
      </div>
    );
  }

  return (
    <form className="card animate-fade-up space-y-5 p-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Spouse 1 name" error={errors.spouse1Name?.message}>
          <input {...register("spouse1Name")} className={fieldClassName} />
        </Field>

        <Field label="Spouse / partner name (optional for individuals)" error={errors.spouse2Name?.message}>
          <input {...register("spouse2Name")} className={fieldClassName} />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <input type="email" {...register("email")} className={fieldClassName} />
        </Field>

        <Field label="Phone / WhatsApp (optional)" error={errors.phone?.message}>
          <input {...register("phone")} className={fieldClassName} />
        </Field>

        <Field label="Location" error={errors.location?.message}>
          <select {...register("location")} className={fieldClassName}>
            {locationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Income range" error={errors.incomeRange?.message}>
          <select {...register("incomeRange")} className={fieldClassName}>
            {incomeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Current savings rate" error={errors.currentSavingsRate?.message}>
          <select {...register("currentSavingsRate")} className={fieldClassName}>
            {savingsRateOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Portfolio range" error={errors.portfolioRange?.message}>
          <select {...register("portfolioRange")} className={fieldClassName}>
            {portfolioOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {incomeRange === "Other" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          OFR is built for the listed income bands. You can still apply and we will review fit.
        </div>
      ) : null}

      <Field label="Biggest goal" error={errors.biggestGoal?.message}>
        <textarea {...register("biggestGoal")} className={`${fieldClassName} min-h-24`} />
      </Field>

      <Field label="Biggest worry" error={errors.biggestWorry?.message}>
        <textarea {...register("biggestWorry")} className={`${fieldClassName} min-h-24`} />
      </Field>

      <label className="ios-soft-panel flex items-start gap-3 p-3 text-sm text-slateBlue-700">
        <input
          type="checkbox"
          {...register("spouseAttendanceConfirmed")}
          className="focus-ring mt-1 h-4 w-4 rounded border-slateBlue-300"
        />
        <span>If applying as a couple, both partners will attend quarterly sessions.</span>
      </label>
      {errors.spouseAttendanceConfirmed ? (
        <p className="text-xs text-red-600">{errors.spouseAttendanceConfirmed.message}</p>
      ) : null}

      <p className="text-xs text-slateBlue-500">
        Individuals are welcome. For married or partnered applicants, join together.
      </p>

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="ios-btn-primary px-5 py-3 text-sm disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Apply"}
      </button>
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="ios-soft-panel p-3 text-sm">
      <p className="text-xs uppercase tracking-wide text-slateBlue-500">{label}</p>
      <p className="mt-1 font-medium text-slateBlue-700">{value}</p>
    </div>
  );
}
