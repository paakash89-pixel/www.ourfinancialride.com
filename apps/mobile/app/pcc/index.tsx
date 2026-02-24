import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost } from "../../lib/api";
import {
  Card,
  InlineNotice,
  Muted,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SegmentedControl,
  SectionTitle,
  Title,
  colors
} from "../../components/ui";

type PccPayload = {
  original: {
    createdAt: string;
  };
  latest: {
    createdAt: string;
    horizonYears: number;
    maxDrawdownTolerance: number;
    thesisHowMoney: string;
    thesisWhyWin10Years: string;
    thesisBreaksPermanently: string;
    breakConditionChecks: string[];
    breakConditionNotes?: string;
  };
};

type EntitlementsPayload = {
  limits: {
    pccLimit: number | null;
  };
};

type ExistingPcc = {
  ticker: string;
  region: "US" | "IN";
};

const normalizeTicker = (value: string): string =>
  value.toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 20);

const cleanError = (message: string): string =>
  message
    .replace(/^POST\s+[^()]+ failed\s*\(?/i, "")
    .replace(/^GET\s+[^()]+ failed\s*\(?/i, "")
    .replace(/\)?$/, "")
    .trim();

const friendlyError = (error: unknown, fallback: string): string => {
  const base = error instanceof Error ? cleanError(error.message) : fallback;
  if (base.includes("Owned position limit reached")) {
    return "Explorer allows 3 Owned companies. Upgrade for unlimited PCC.";
  }
  if (base.includes("At least one break condition is required")) {
    return "Add at least one break condition item.";
  }
  if (base.includes("No PCC found")) {
    return "No PCC found for this ticker yet.";
  }
  return base || fallback;
};

export default function PccScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ticker?: string; region?: string }>();
  const [ticker, setTicker] = useState("AAPL");
  const [region, setRegion] = useState<"US" | "IN">("US");
  const [horizonYears, setHorizonYears] = useState("10");
  const [maxDrawdownTolerance, setMaxDrawdownTolerance] = useState<20 | 40 | 60>(40);
  const [thesisHowMoney, setThesisHowMoney] = useState("");
  const [thesisWhyWin10Years, setThesisWhyWin10Years] = useState("");
  const [thesisBreaksPermanently, setThesisBreaksPermanently] = useState("");
  const [breakChecks, setBreakChecks] = useState("");
  const [breakNotes, setBreakNotes] = useState("");
  const [saved, setSaved] = useState<PccPayload | null>(null);
  const [pccLimit, setPccLimit] = useState<number | null>(null);
  const [existingOwned, setExistingOwned] = useState<Array<{ ticker: string; region: "US" | "IN" }>>(
    []
  );
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("intrinsic_default_horizon").then((value) => {
      if (value && !Number.isNaN(Number(value))) setHorizonYears(value);
    });
    AsyncStorage.getItem("intrinsic_default_drawdown").then((value) => {
      if (value === "20" || value === "40" || value === "60") {
        setMaxDrawdownTolerance(Number(value) as 20 | 40 | 60);
      }
    });

    Promise.all([
      apiGet<EntitlementsPayload>("/me/entitlements"),
      apiGet<ExistingPcc[]>("/me/pccs")
    ])
      .then(([entitlements, pccs]) => {
        setPccLimit(entitlements.limits.pccLimit);
        const unique = new Map<string, { ticker: string; region: "US" | "IN" }>();
        for (const row of pccs) {
          unique.set(`${row.region}:${row.ticker}`, {
            ticker: row.ticker,
            region: row.region
          });
        }
        setExistingOwned([...unique.values()]);
      })
      .catch(() => {
        setPccLimit(null);
      });
  }, []);

  useEffect(() => {
    if (typeof params.ticker === "string" && params.ticker.trim()) {
      setTicker(normalizeTicker(params.ticker));
    }
    if (params.region === "US" || params.region === "IN") {
      setRegion(params.region);
    }
  }, [params.region, params.ticker]);

  const checks = useMemo(
    () =>
      breakChecks
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [breakChecks]
  );

  const horizon = Number(horizonYears);
  const horizonValid = Number.isInteger(horizon) && horizon >= 1 && horizon <= 50;

  const missing = useMemo(() => {
    const next: string[] = [];
    const safeTicker = normalizeTicker(ticker);
    const alreadyOwned = existingOwned.some(
      (item) => item.region === region && item.ticker === safeTicker
    );
    const limitReached =
      pccLimit !== null && existingOwned.length >= pccLimit && !alreadyOwned;

    if (!normalizeTicker(ticker)) next.push("Ticker");
    if (limitReached) next.push(`PCC limit reached (${pccLimit}) on current plan`);
    if (!horizonValid) next.push("Horizon must be 1 to 50");
    if (thesisHowMoney.trim().length < 10) next.push("How it makes money (min 10 chars)");
    if (thesisWhyWin10Years.trim().length < 10)
      next.push("Why it wins in 10 years (min 10 chars)");
    if (thesisBreaksPermanently.trim().length < 10)
      next.push("What breaks it permanently (min 10 chars)");
    if (checks.length < 1) next.push("At least 1 break-condition item");
    return next;
  }, [
    ticker,
    horizonValid,
    thesisHowMoney,
    thesisWhyWin10Years,
    thesisBreaksPermanently,
    checks,
    existingOwned,
    pccLimit,
    region
  ]);

  const canSave = missing.length === 0 && !saving;

  const load = async () => {
    const safeTicker = normalizeTicker(ticker);
    if (!safeTicker) {
      setStatus("Add a valid ticker first.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiGet<PccPayload>(`/owned/${safeTicker}/pcc?region=${region}`);
      setSaved(response);
      setHorizonYears(String(response.latest.horizonYears));
      setMaxDrawdownTolerance(response.latest.maxDrawdownTolerance as 20 | 40 | 60);
      setThesisHowMoney(response.latest.thesisHowMoney);
      setThesisWhyWin10Years(response.latest.thesisWhyWin10Years);
      setThesisBreaksPermanently(response.latest.thesisBreaksPermanently);
      setBreakChecks(response.latest.breakConditionChecks.join("\n"));
      setBreakNotes(response.latest.breakConditionNotes ?? "");
      setStatus("PCC loaded. Saving creates a new immutable revision.");
    } catch (error) {
      setSaved(null);
      setStatus(friendlyError(error, "Could not load PCC."));
    } finally {
      setLoading(false);
    }
  };

  const applyStarter = () => {
    const symbol = normalizeTicker(ticker) || "THIS COMPANY";
    if (!thesisHowMoney.trim()) {
      setThesisHowMoney(`${symbol} generates cash from durable demand and repeat usage.`);
    }
    if (!thesisWhyWin10Years.trim()) {
      setThesisWhyWin10Years(`${symbol} can win over 10 years if moat and execution remain strong.`);
    }
    if (!thesisBreaksPermanently.trim()) {
      setThesisBreaksPermanently(`${symbol} breaks if pricing power and cash generation deteriorate permanently.`);
    }
    if (!breakChecks.trim()) {
      setBreakChecks(
        "Revenue declines for 3+ years\nOperating cash flow weak vs net income for 3+ years"
      );
    }
    setStatus("Starter text added. Personalize before saving.");
  };

  const save = async () => {
    const safeTicker = normalizeTicker(ticker);
    if (!safeTicker) {
      setStatus("Add a valid ticker first.");
      return;
    }
    if (!canSave) {
      setStatus("Please complete missing fields before saving.");
      return;
    }

    setSaving(true);
    try {
      await apiPost(`/owned/${safeTicker}/pcc`, {
        region,
        horizonYears: horizon,
        maxDrawdownTolerance,
        thesisHowMoney: thesisHowMoney.trim(),
        thesisWhyWin10Years: thesisWhyWin10Years.trim(),
        thesisBreaksPermanently: thesisBreaksPermanently.trim(),
        breakConditionChecks: checks,
        breakConditionNotes: breakNotes.trim()
      });
      setStatus("PCC saved. Open Owned Detail or Sell Flow.");
      await load();
    } catch (error) {
      setStatus(friendlyError(error, "Could not save PCC."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Title>Pre-Commitment Contract</Title>

        <Card>
          <Muted>PCC is immutable. Every edit creates a new version linked to the original commitment.</Muted>
        </Card>

        <Card>
          <SectionTitle>Company</SectionTitle>
          <TextInput
            value={ticker}
            onChangeText={(value) => setTicker(normalizeTicker(value))}
            placeholder="Ticker"
            placeholderTextColor="#7A7A7A"
            style={styles.input}
          />
          <SegmentedControl
            value={region}
            onChange={setRegion}
            options={[
              { label: "United States", value: "US" },
              { label: "India", value: "IN" }
            ]}
          />
          <SecondaryButton title={loading ? "Loading..." : "Load Existing PCC"} onPress={load} disabled={loading} />
        </Card>

        {saved ? (
          <Card>
            <SectionTitle>Version History</SectionTitle>
            <Muted>
              Original: {new Date(saved.original.createdAt).toLocaleDateString()} • Latest: {" "}
              {new Date(saved.latest.createdAt).toLocaleDateString()}
            </Muted>
          </Card>
        ) : null}

        <Card>
          <SectionTitle>Commitment Inputs</SectionTitle>
          <TextInput
            value={horizonYears}
            onChangeText={setHorizonYears}
            keyboardType="numeric"
            placeholder="Horizon years (1-50)"
            placeholderTextColor="#7A7A7A"
            style={styles.input}
          />
          <SegmentedControl
            value={String(maxDrawdownTolerance) as "20" | "40" | "60"}
            onChange={(value) => setMaxDrawdownTolerance(Number(value) as 20 | 40 | 60)}
            options={[
              { label: "20%", value: "20" },
              { label: "40%", value: "40" },
              { label: "60%", value: "60" }
            ]}
          />
          <SecondaryButton title="Use Starter Text" onPress={applyStarter} />
          <TextInput
            value={thesisHowMoney}
            onChangeText={setThesisHowMoney}
            multiline
            placeholder="1) How does it make money?"
            placeholderTextColor="#7A7A7A"
            style={[styles.input, styles.textarea]}
          />
          <TextInput
            value={thesisWhyWin10Years}
            onChangeText={setThesisWhyWin10Years}
            multiline
            placeholder="2) Why will it win over 10 years?"
            placeholderTextColor="#7A7A7A"
            style={[styles.input, styles.textarea]}
          />
          <TextInput
            value={thesisBreaksPermanently}
            onChangeText={setThesisBreaksPermanently}
            multiline
            placeholder="3) What would permanently break it?"
            placeholderTextColor="#7A7A7A"
            style={[styles.input, styles.textarea]}
          />
          <TextInput
            value={breakChecks}
            onChangeText={setBreakChecks}
            multiline
            placeholder="Break conditions (one per line)"
            placeholderTextColor="#7A7A7A"
            style={[styles.input, styles.textarea]}
          />
          <TextInput
            value={breakNotes}
            onChangeText={setBreakNotes}
            multiline
            placeholder="Optional context"
            placeholderTextColor="#7A7A7A"
            style={[styles.input, styles.textarea]}
          />
        </Card>

        {missing.length ? (
          <Card>
            <SectionTitle>Before Saving</SectionTitle>
            {missing.map((item) => (
              <Text key={item} style={styles.missingItem}>
                - {item}
              </Text>
            ))}
          </Card>
        ) : null}

        <Card>
          <PrimaryButton title={saving ? "Saving..." : "Save PCC"} onPress={save} disabled={!canSave} />
          <SecondaryButton
            title="Open Owned Detail"
            onPress={() => router.push(`/company/${normalizeTicker(ticker)}?region=${region}`)}
          />
        </Card>

        {status ? <InlineNotice tone="act">{status}</InlineNotice> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 24
  },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: "#FFFEFC",
    fontSize: 16
  },
  textarea: {
    minHeight: 104,
    textAlignVertical: "top"
  },
  missingItem: {
    color: colors.text,
    fontSize: 14
  }
});
