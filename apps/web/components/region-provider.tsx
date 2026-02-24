"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { defaultRegion, type Region } from "../lib/region";

const STORAGE_KEY = "ofr-region";
const REGION_EVENT = "ofr-region-change";

const readRegion = (): Region => {
  if (typeof window === "undefined") return defaultRegion;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "US" ? "US" : "IN";
};

const writeRegion = (next: Region) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, next);
  window.dispatchEvent(new CustomEvent<Region>(REGION_EVENT, { detail: next }));
};

export function RegionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useRegion() {
  const [region, setRegionState] = useState<Region>(defaultRegion);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setRegionState(readRegion());
    setIsReady(true);

    const onRegionChange = (event: Event) => {
      const custom = event as CustomEvent<Region>;
      if (custom.detail === "IN" || custom.detail === "US") {
        setRegionState(custom.detail);
        return;
      }
      setRegionState(readRegion());
    };

    const onStorage = () => {
      setRegionState(readRegion());
    };

    window.addEventListener(REGION_EVENT, onRegionChange);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(REGION_EVENT, onRegionChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setRegion = useCallback((next: Region) => {
    setRegionState(next);
    writeRegion(next);
  }, []);

  return { region, setRegion, isReady };
}
