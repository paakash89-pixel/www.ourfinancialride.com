import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
  latest: {
    createdAt: string;
    thesisHowMoney: string;
    thesisWhyWin10Years: string;
    thesisBreaksPermanently: string;
    breakConditionChecks: string[];
  };
};

type StartPayload = {
  cooldownSessionId: string;
  cooldownEndsAt: string;
  commitmentDays: number;
};

type CompletePayload = {
  idempotent?: boolean;
  calmWarning: string | null;
  regretPreview: {
    regret3mPct: number | null;
    regret6mPct: number | null;
    regret12mPct: number | null;
    regretCostAmount: number | null;
  } | null;
};

const makeClientEventId = (ticker: string): string =>
  `sell-${ticker}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
  if (base.includes("PCC required")) {
    return "Create PCC first for this ticker.";
  }
  if (base.includes("Cooldown still active")) {
    return "Wait for cooldown to finish.";
  }
  if (base.includes("Invalid cooldown session")) {
    return "Cooldown expired. Start again.";
  }
  if (base.includes("already used")) {
    return "Cooldown already used. Start a new one.";
  }
  if (base.includes("No PCC found")) {
    return "No PCC found for this ticker.";
  }
  return base || fallback;
};

export default function SellFlowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ticker?: string; region?: string }>();

  const [ticker, setTicker] = useState("AAPL");
  const [region, setRegion] = useState<"US" | "IN">("US");
  const [pcc, setPcc] = useState<PccPayload | null>(null);
  const [selectedBreaks, setSelectedBreaks] = useState<string[]>([]);
  const [reasonText, setReasonText] = useState("");
  const [session, setSession] = useState<StartPayload | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [result, setResult] = useState<CompletePayload | null>(null);
  const [status, setStatus] = useState("");
  const [loadingPcc, setLoadingPcc] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof params.ticker === "string" && params.ticker.trim()) {
      setTicker(normalizeTicker(params.ticker));
    }
    if (params.region === "US" || params.region === "IN") {
      setRegion(params.region);
    }
  }, [params.region, params.ticker]);

  const reasonLength = reasonText.trim().length;
  const reasonRemaining = Math.max(0, 10 - reasonLength);

  const breakConditionTriggered = selectedBreaks.length > 0;

  const blockers = useMemo(() => {
    const next: string[] = [];
    if (!pcc) next.push("Load PCC first");
    if (!session) next.push("Start cooldown");
    if (session && countdown > 0) next.push(`Wait ${countdown}s`);
    if (reasonLength < 10) next.push(`Write what changed (${reasonRemaining} more chars)`);
    return next;
  }, [pcc, session, countdown, reasonLength, reasonRemaining]);

  const canComplete = blockers.length === 0 && !submitting;

  useEffect(() => {
    if (!session) {
      setCountdown(0);
      return;
    }

    const tick = () => {
      const remaining = Math.ceil(
        (new Date(session.cooldownEndsAt).getTime() - Date.now()) / 1000
      );
      setCountdown(Math.max(0, remaining));
    };
    tick();
    const handle = setInterval(tick, 1000);
    return () => clearInterval(handle);
  }, [session]);

  const loadPcc = async () => {
    const safeTicker = normalizeTicker(ticker);
    if (!safeTicker) {
      setStatus("Add a valid ticker first.");
      return;
    }

    setLoadingPcc(true);
    try {
      const data = await apiGet<PccPayload>(`/owned/${safeTicker}/pcc?region=${region}`);
      setPcc(data);
      setSelectedBreaks([]);
      setSession(null);
      setResult(null);
      setStatus("PCC loaded. Start cooldown when ready.");
    } catch (error) {
      setPcc(null);
      setStatus(friendlyError(error, "Could not load PCC."));
    } finally {
      setLoadingPcc(false);
    }
  };

  const startFlow = async () => {
    if (!pcc) {
      setStatus("Load PCC first.");
      return;
    }

    setStarting(true);
    try {
      const started = await apiPost<StartPayload>("/events", {
        action: "START",
        ticker: normalizeTicker(ticker),
        region
      });
      setSession(started);
      setResult(null);
      setStatus(`Cooldown started. Commitment age: ${started.commitmentDays} days.`);
    } catch (error) {
      setStatus(friendlyError(error, "Could not start cooldown."));
    } finally {
      setStarting(false);
    }
  };

  const toggleBreak = (item: string) => {
    setSelectedBreaks((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]
    );
  };

  const complete = async (type: "PANIC_SELL_SIMULATED" | "HELD") => {
    if (!session) return;

    setSubmitting(true);
    try {
      const response = await apiPost<CompletePayload>("/events", {
        action: "COMPLETE",
        ticker: normalizeTicker(ticker),
        region,
        cooldownSessionId: session.cooldownSessionId,
        clientEventId: makeClientEventId(ticker),
        type,
        reasonText: reasonText.trim(),
        breakConditionTriggered,
        breakConditionMatches: selectedBreaks,
        positionSizeLabel: "CUSTOM",
        notional: region === "IN" ? 800000 : 10000
      });
      setResult(response);
      setStatus(type === "HELD" ? "Held event logged." : "Panic sell simulation logged.");
      setSession(null);
      setReasonText("");
      setSelectedBreaks([]);
    } catch (error) {
      setStatus(friendlyError(error, "Could not complete sell flow."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Title>I Feel Like Selling</Title>

        <Card>
          <Muted>
            This flow adds friction before action: review PCC, wait 60 seconds, state fundamental changes, then log outcome.
          </Muted>
        </Card>

        <Card>
          <SectionTitle>Step 1: Load PCC</SectionTitle>
          <TextInput
            value={ticker}
            onChangeText={(value) => setTicker(normalizeTicker(value))}
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
          <SecondaryButton
            title={loadingPcc ? "Loading..." : "Load PCC"}
            onPress={loadPcc}
            disabled={loadingPcc}
          />
          <SecondaryButton
            title="Open PCC"
            onPress={() => router.push(`/pcc?ticker=${normalizeTicker(ticker)}&region=${region}`)}
          />
        </Card>

        {pcc ? (
          <Card>
            <SectionTitle>PCC Snapshot</SectionTitle>
            <Muted>Committed on {new Date(pcc.latest.createdAt).toLocaleDateString()}</Muted>
            <Text style={styles.body}>{pcc.latest.thesisHowMoney}</Text>
            <Text style={styles.body}>{pcc.latest.thesisWhyWin10Years}</Text>
            <Text style={styles.body}>{pcc.latest.thesisBreaksPermanently}</Text>
          </Card>
        ) : null}

        <Card>
          <SectionTitle>Step 2: 60-Second Cooldown</SectionTitle>
          <PrimaryButton title={starting ? "Starting..." : "Start Cooldown"} onPress={startFlow} disabled={!pcc || starting} />
          <InlineNotice tone={countdown > 0 ? "watch" : "steady"}>Cooldown remaining: {countdown}s</InlineNotice>
        </Card>

        <Card>
          <SectionTitle>Step 3: Reflection</SectionTitle>
          <TextInput
            multiline
            numberOfLines={4}
            value={reasonText}
            onChangeText={setReasonText}
            placeholder="What changed in fundamentals?"
            placeholderTextColor="#7A7A7A"
            style={[styles.input, styles.textarea]}
          />
          <Muted>
            {reasonRemaining > 0
              ? `Please add ${reasonRemaining} more characters.`
              : "Reason is complete."}
          </Muted>

          <SectionTitle>Break Conditions Triggered?</SectionTitle>
          {pcc?.latest.breakConditionChecks.length ? (
            <View style={styles.checklist}>
              {pcc.latest.breakConditionChecks.map((item) => {
                const selected = selectedBreaks.includes(item);
                return (
                  <SecondaryButton
                    key={item}
                    title={selected ? `✓ ${item}` : item}
                    onPress={() => toggleBreak(item)}
                  />
                );
              })}
            </View>
          ) : (
            <Muted>No break-condition checklist found in PCC.</Muted>
          )}

          {!breakConditionTriggered ? (
            <InlineNotice tone="act">
              This appears emotion-driven; consider waiting.
            </InlineNotice>
          ) : null}

          <View style={styles.row}>
            <SecondaryButton title="I Held" onPress={() => complete("HELD")} disabled={!canComplete} />
            <PrimaryButton
              title="I Panic Sold (simulated)"
              onPress={() => complete("PANIC_SELL_SIMULATED")}
              disabled={!canComplete}
            />
          </View>
        </Card>

        {blockers.length ? (
          <Card>
            <SectionTitle>To Unlock Final Buttons</SectionTitle>
            {blockers.map((item) => (
              <Text key={item} style={styles.blockerItem}>
                - {item}
              </Text>
            ))}
          </Card>
        ) : null}

        {result?.regretPreview ? (
          <Card>
            <SectionTitle>Counterfactual Snapshot</SectionTitle>
            <Muted>
              3m: {result.regretPreview.regret3mPct ?? "n/a"}% • 6m: {" "}
              {result.regretPreview.regret6mPct ?? "n/a"}% • 12m: {" "}
              {result.regretPreview.regret12mPct ?? "n/a"}%
            </Muted>
            <Muted>
              Example regret cost: {result.regretPreview.regretCostAmount ?? "n/a"}
            </Muted>
          </Card>
        ) : null}

        {result?.calmWarning ? <InlineNotice tone="act">{result.calmWarning}</InlineNotice> : null}
        {status ? <InlineNotice tone="steady">{status}</InlineNotice> : null}
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
    minHeight: 110,
    textAlignVertical: "top"
  },
  body: {
    color: colors.text
  },
  checklist: {
    gap: 8
  },
  row: {
    gap: 8
  },
  blockerItem: {
    color: colors.text,
    fontSize: 14
  }
});
