import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiGet, apiPost } from "../../lib/api";
import {
  Card,
  Chip,
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

type Profile = {
  region: "US" | "IN";
  currency: string;
};

type StressStatus = {
  region: "US" | "IN";
  stressModeActive: boolean;
  drawdownPct: number;
  peakDate: string | null;
  activePeriod: {
    startDate: string;
  } | null;
};

type DisciplineSummary = {
  score: number;
  delta: number;
  holdStreakDays: number;
  bestHoldStreakDays: number;
  stressModeActive: boolean;
  dueWeeklyReflection: boolean;
  contributors: {
    commitment: number;
    resilience: number;
    consistency: number;
    guardrails: number;
  };
  suggestions: string[];
};

type PccItem = {
  ticker: string;
  region: "US" | "IN";
  createdAt: string;
};

const reflectionPrompt = "What fundamental fact did you verify this week?";

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<"US" | "IN">("US");
  const [stress, setStress] = useState<StressStatus | null>(null);
  const [discipline, setDiscipline] = useState<DisciplineSummary | null>(null);
  const [pccs, setPccs] = useState<PccItem[]>([]);
  const [reflectionText, setReflectionText] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);
  const [stressRedirected, setStressRedirected] = useState(false);
  const [status, setStatus] = useState("");

  const loadAll = async (nextRegion?: "US" | "IN") => {
    const activeRegion = nextRegion ?? region;
    try {
      const [me, stressStatus, disciplineSummary, pccList] = await Promise.all([
        apiGet<Profile>("/me/profile"),
        apiGet<StressStatus>(`/market/stress?region=${activeRegion}`),
        apiGet<DisciplineSummary>("/me/discipline"),
        apiGet<PccItem[]>("/me/pccs")
      ]);

      setProfile(me);
      if (!profile) {
        setRegion(me.region);
      }
      setStress(stressStatus);
      setDiscipline(disciplineSummary);
      setPccs(pccList);
      setStatus("");
    } catch {
      setStatus("Could not load your dashboard right now.");
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!profile) return;
    void loadAll(region);
  }, [region]);

  useEffect(() => {
    if (!stress?.stressModeActive || stressRedirected) return;
    setStressRedirected(true);
    router.replace("/stress" as never);
  }, [router, stress?.stressModeActive, stressRedirected]);

  const ownedLatest = useMemo(() => {
    const map = new Map<string, PccItem>();
    for (const item of pccs) {
      const key = `${item.region}:${item.ticker}`;
      const current = map.get(key);
      if (!current || new Date(item.createdAt).getTime() > new Date(current.createdAt).getTime()) {
        map.set(key, item);
      }
    }
    return [...map.values()].sort((a, b) => a.ticker.localeCompare(b.ticker));
  }, [pccs]);

  const submitReflection = async () => {
    if (reflectionText.trim().length < 10) {
      setStatus("Please write at least 10 characters for your weekly reflection.");
      return;
    }

    setSavingReflection(true);
    try {
      await apiPost("/me/discipline/reflection", {
        prompt: reflectionPrompt,
        responseText: reflectionText.trim()
      });
      setReflectionText("");
      setStatus("Weekly reflection saved.");
      await loadAll();
    } catch {
      setStatus("Could not save weekly reflection.");
    } finally {
      setSavingReflection(false);
    }
  };

  const milestone =
    discipline && [30, 90, 180, 365].some((m) => discipline.holdStreakDays === m)
      ? `Milestone reached: ${discipline.holdStreakDays} days`
      : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Chip>Discipline Operating System</Chip>
          <Title>Intrinsic</Title>
          <Muted>Crash Hold Rate improves when process beats emotion.</Muted>
        </View>

        <Card>
          <SectionTitle>Region</SectionTitle>
          <SegmentedControl
            value={region}
            onChange={setRegion}
            options={[
              { label: "United States", value: "US" },
              { label: "India", value: "IN" }
            ]}
          />
        </Card>

        <Card>
          <View style={styles.headRow}>
            <SectionTitle>Discipline Score</SectionTitle>
            <Chip>{discipline?.score ?? 0}/100</Chip>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricValue}>{discipline?.score ?? 0}</Text>
            <Muted>{discipline && discipline.delta >= 0 ? `+${discipline.delta}` : discipline?.delta ?? 0} today</Muted>
          </View>
          <Muted>
            Commitment {discipline?.contributors.commitment ?? 0} • Resilience {discipline?.contributors.resilience ?? 0}
          </Muted>
          <Muted>
            Consistency {discipline?.contributors.consistency ?? 0} • Guardrails {discipline?.contributors.guardrails ?? 0}
          </Muted>
          <Muted>{discipline?.suggestions?.[0] ?? "Open your plan and stay process-first."}</Muted>
        </Card>

        <Card>
          <View style={styles.headRow}>
            <SectionTitle>Hold Streak</SectionTitle>
            <Chip>{discipline?.holdStreakDays ?? 0}d</Chip>
          </View>
          <Muted>
            Current: {discipline?.holdStreakDays ?? 0} days • Best: {discipline?.bestHoldStreakDays ?? 0} days
          </Muted>
          {milestone ? <InlineNotice tone="watch">{milestone}</InlineNotice> : null}
        </Card>

        <Card>
          <View style={styles.headRow}>
            <SectionTitle>Stress Mode</SectionTitle>
            <Chip>{stress?.stressModeActive ? "ON" : "Steady"}</Chip>
          </View>
          {stress?.stressModeActive ? (
            <InlineNotice tone="watch">
              Drawdown {(stress.drawdownPct * 100).toFixed(1)}%. Act only if break conditions are triggered.
            </InlineNotice>
          ) : (
            <InlineNotice tone="steady">Market is steady right now. Keep your plan current.</InlineNotice>
          )}
          <PrimaryButton title="Open Your Plan" onPress={() => router.push("/stress" as never)} />
        </Card>

        <Card>
          <SectionTitle>Owned</SectionTitle>
          {ownedLatest.length ? (
            <View style={styles.ownedList}>
              {ownedLatest.map((item) => (
                <Pressable
                  key={`${item.region}:${item.ticker}`}
                  onPress={() => router.push(`/company/${item.ticker}?region=${item.region}`)}
                  style={styles.ownedRow}
                >
                  <Text style={styles.ownedTicker}>{item.ticker}</Text>
                  <Muted>{item.region} • PCC ready</Muted>
                </Pressable>
              ))}
            </View>
          ) : (
            <Muted>No Owned companies yet. Create your first PCC.</Muted>
          )}
          <SecondaryButton title="Create / Update PCC" onPress={() => router.push("/pcc")} />
        </Card>

        {discipline?.dueWeeklyReflection ? (
          <Card>
            <SectionTitle>Weekly Reflection</SectionTitle>
            <Muted>{reflectionPrompt}</Muted>
            <TextInput
              multiline
              value={reflectionText}
              onChangeText={setReflectionText}
              placeholder="Keep it brief and specific."
              placeholderTextColor="#7A7A7A"
              style={[styles.input, styles.textarea]}
            />
            <PrimaryButton
              title={savingReflection ? "Saving..." : "Submit Reflection"}
              onPress={submitReflection}
              disabled={savingReflection}
            />
          </Card>
        ) : null}

        <Card>
          <SectionTitle>Actions</SectionTitle>
          <PrimaryButton title="I Feel Like Selling" onPress={() => router.push("/sell")} />
          <SecondaryButton title="Regret Ledger" onPress={() => router.push("/regret")} />
          <SecondaryButton title="Settings" onPress={() => router.push("/settings")} />
        </Card>

        {status ? <InlineNotice tone="act">{status}</InlineNotice> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingBottom: 24
  },
  header: {
    gap: 6,
    marginBottom: 2
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8
  },
  metricValue: {
    fontSize: 44,
    lineHeight: 46,
    color: colors.text,
    fontWeight: "700",
    letterSpacing: -0.8
  },
  ownedList: {
    gap: 8
  },
  ownedRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FDFBF6",
    gap: 4
  },
  ownedTicker: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
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
    minHeight: 90,
    textAlignVertical: "top"
  }
});
