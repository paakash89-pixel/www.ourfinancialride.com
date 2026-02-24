import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { apiGet } from "../../lib/api";
import {
  Card,
  Chip,
  InlineNotice,
  Muted,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionTitle,
  Title,
  colors
} from "../../components/ui";

type Profile = {
  region: "US" | "IN";
};

type StressStatus = {
  region: "US" | "IN";
  stressModeActive: boolean;
  drawdownPct: number;
  activePeriod: {
    startDate: string;
  } | null;
};

type DisciplineSummary = {
  score: number;
  holdStreakDays: number;
  suggestions: string[];
};

type PccItem = {
  ticker: string;
  region: "US" | "IN";
  createdAt: string;
};

const checklist = [
  "Read your PCC before any action.",
  "Write what changed in fundamentals.",
  "Confirm break conditions before simulating a sell.",
  "If no break is triggered, wait and reassess tomorrow."
];

const crashPlaybook = [
  "Drawdowns happen. Process quality matters more than headlines.",
  "Temporary volatility is not the same as permanent thesis break.",
  "Use your written break conditions as the decision boundary."
];

export default function StressModeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stress, setStress] = useState<StressStatus | null>(null);
  const [discipline, setDiscipline] = useState<DisciplineSummary | null>(null);
  const [pccs, setPccs] = useState<PccItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const me = await apiGet<Profile>("/me/profile");
        setProfile(me);
        const [stressStatus, disciplineSummary, pccList] = await Promise.all([
          apiGet<StressStatus>(`/market/stress?region=${me.region}`),
          apiGet<DisciplineSummary>("/me/discipline"),
          apiGet<PccItem[]>("/me/pccs")
        ]);
        setStress(stressStatus);
        setDiscipline(disciplineSummary);
        setPccs(pccList);
      } catch {
        setError("Could not load Stress Mode.");
      }
    };

    void load();
  }, []);

  const owned = useMemo(() => {
    const seen = new Set<string>();
    const output: PccItem[] = [];
    for (const item of pccs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
      const key = `${item.region}:${item.ticker}`;
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(item);
    }
    return output;
  }, [pccs]);

  if (error) {
    return (
      <Screen>
        <InlineNotice tone="act">{error}</InlineNotice>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Chip>Your Plan</Chip>
          <Title>Stress Mode</Title>
          <Muted>Reduce noise. Follow your process.</Muted>
        </View>

        <Card>
          <View style={styles.row}>
            <SectionTitle>Status</SectionTitle>
            <Chip>{stress?.stressModeActive ? "Stress ON" : "Steady"}</Chip>
          </View>
          {stress?.stressModeActive ? (
            <InlineNotice tone="watch">
              {stress.region} drawdown {(stress.drawdownPct * 100).toFixed(1)}% since{" "}
              {stress.activePeriod
                ? new Date(stress.activePeriod.startDate).toLocaleDateString()
                : "recent peak"}.
            </InlineNotice>
          ) : (
            <InlineNotice tone="steady">Stress threshold is currently not triggered.</InlineNotice>
          )}
          <Muted>
            Discipline score {discipline?.score ?? 0} • Hold streak {discipline?.holdStreakDays ?? 0} days
          </Muted>
        </Card>

        <Card>
          <SectionTitle>Hold Checklist</SectionTitle>
          {checklist.map((item) => (
            <Text key={item} style={styles.listItem}>
              - {item}
            </Text>
          ))}
        </Card>

        <Card>
          <SectionTitle>PCC Quick Access</SectionTitle>
          {owned.length ? (
            <View style={styles.ownedList}>
              {owned.map((item) => (
                <SecondaryButton
                  key={`${item.region}:${item.ticker}`}
                  title={`${item.ticker} (${item.region})`}
                  onPress={() => router.push(`/company/${item.ticker}?region=${item.region}`)}
                />
              ))}
            </View>
          ) : (
            <Muted>No PCC found yet. Create one before marking ownership.</Muted>
          )}
          <PrimaryButton title="Create / Update PCC" onPress={() => router.push("/pcc")} />
        </Card>

        <Card>
          <SectionTitle>Crash Playbook</SectionTitle>
          {crashPlaybook.map((item) => (
            <Muted key={item}>{item}</Muted>
          ))}
          <Muted>{discipline?.suggestions?.[0] ?? "Keep actions small and process-led."}</Muted>
        </Card>

        <Card>
          <PrimaryButton title="I Feel Like Selling" onPress={() => router.push("/sell")} />
          <SecondaryButton title="Back to Dashboard" onPress={() => router.push("/home")} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 24
  },
  header: {
    gap: 6
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  listItem: {
    color: colors.text,
    fontSize: 14
  },
  ownedList: {
    gap: 8
  }
});
