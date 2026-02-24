"use client";

import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

const TOOL_PROGRESS_EVENT = "ofr-tool-progress-update";

export function usePersistedForm<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  storageKey: string
) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<TFieldValues>;
      form.reset({ ...form.getValues(), ...parsed });
    } catch {
      // Ignore malformed local storage data.
    }
  }, [form, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const subscription = form.watch((value) => {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
      window.dispatchEvent(new Event(TOOL_PROGRESS_EVENT));
    });

    return () => subscription.unsubscribe();
  }, [form, storageKey]);
}
