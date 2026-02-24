"use client";

import { useEffect, useRef } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { convertAmount, roundMoney } from "../../lib/currency";
import type { Region } from "../../lib/region";
import { useRegion } from "../region-provider";

export function useRegionMoneyFields<T extends FieldValues>(
  form: UseFormReturn<T>,
  fields: Path<T>[]
) {
  const { region } = useRegion();
  const prevRegionRef = useRef<Region>(region);

  useEffect(() => {
    const previous = prevRegionRef.current;
    if (previous === region) return;

    fields.forEach((field) => {
      const value = form.getValues(field);
      if (typeof value === "number" && Number.isFinite(value)) {
        const converted = roundMoney(convertAmount(value, previous, region));
        form.setValue(field, converted as T[Path<T>], {
          shouldDirty: true,
          shouldValidate: true
        });
      }
    });

    prevRegionRef.current = region;
  }, [fields, form, region]);

  return region;
}
