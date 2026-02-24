"use client";

import type { InputHTMLAttributes } from "react";
import { Controller, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { formatNumberByRegion } from "../../lib/currency";
import type { Region } from "../../lib/region";

const sanitizeNumeric = (value: string): number | undefined => {
  const cleaned = value.replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatWithGrouping = (value: number, region: Region): string =>
  formatNumberByRegion(value, region);

export function CommaNumberInput<T extends FieldValues>({
  formApi,
  name,
  region,
  className,
  inputMode = "numeric",
  ...rest
}: {
  formApi: UseFormReturn<T>;
  name: Path<T>;
  region: Region;
  className: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "type" | "value" | "onChange">) {
  return (
    <Controller
      control={formApi.control}
      name={name}
      render={({ field }) => {
        const numericValue =
          typeof field.value === "number" && Number.isFinite(field.value)
            ? field.value
            : undefined;
        const displayValue = numericValue === undefined ? "" : formatWithGrouping(numericValue, region);

        return (
          <input
            {...rest}
            ref={field.ref}
            name={field.name}
            type="text"
            inputMode={inputMode}
            className={className}
            value={displayValue}
            onBlur={field.onBlur}
            onChange={(event) => {
              field.onChange(sanitizeNumeric(event.target.value));
            }}
          />
        );
      }}
    />
  );
}
