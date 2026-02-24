import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { apiGet } from "../../../lib/api";
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
} from "../../../components/ui";

type PccResponse = {
  ticker: string;
  region: "US" | "IN";
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
  versions: Array<{
    id: string;
    createdAt: string;
  }>;
};

type RegretLedger = {
  currency: string;
  entries: Array<{
    id: string;
    ticker: string;
    region: "US" | "IN";
    eventType: "PANIC_SELL_SIMULATED" | "HELD";
    timestamp: string;
    reasonText: string;
    breakConditionTriggered: boolean;
    regret3mPct: number | null;
    regret6mPct: number | null;
    regret12mPct: number | null;
    regretCostAmount: number | null;
  }>;
};

export default function OwnedDetailScreen() {
  const router = useRouter();
  const { ticker, region } = useLocalSearchParams<{ ticker: string; region?: string }>();
  const safeTicker = (ticker ?? "").toUpperCase();
  const safeRegion = region === "IN" ? "IN" : "US";

  const [pcc, setPcc] = useState<PccResponse | null>(null);
  const [ledger, setLedger] = useState<RegretLedger | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!safeTicker) return;

    Promise.all([
      apiGet<PccResponse>(`/owned/${safeTicker}/pcc?region=${safeRegion}`),
      apiGet<RegretLedger>("/me/regret")
    ])
      .then(([pccData, regretData]) => {
        setPcc(pccData);
        setLedger(regretData);
        setError("");
      })
      .catch(() => {
        setPcc(null);
        setLedger(null);
        setError("Could not load Owned detail right now.");
      });
  }, [safeTicker, safeRegion]);

  const events = useMemo(
    () =>
      (ledger?.entries ?? [])
        .filter((item) => item.ticker === safeTicker && item.region === safeRegion)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [ledger, safeTicker, safeRegion]
  );

  const commitmentDays = pcc
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(pcc.original.createdAt).getTime()) / (24 * 60 * 60 * 1000)
        )
      )
    : 0;

  return (
    <Screen>
      <Title>{safeTicker || "Owned"}</Title>
      {pcc ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card>
            <View style={styles.row}>
              <SectionTitle>Commitment Status</SectionTitle>
              <Chip>{safeRegion}</Chip>
            </View>
            <Muted>
              Committed for {commitmentDays} days • Horizon {pcc.latest.horizonYears} years • Max drawdown tolerance {pcc.latest.maxDrawdownTolerance}%
            </Muted>
          </Card>

          <Card>
            <SectionTitle>PCC Summary</SectionTitle>
            <Text style={styles.body}>{pcc.latest.thesisHowMoney}</Text>
            <Text style={styles.body}>{pcc.latest.thesisWhyWin10Years}</Text>
            <Text style={styles.body}>{pcc.latest.thesisBreaksPermanently}</Text>
            <Muted>Break conditions:</Muted>
            {pcc.latest.breakConditionChecks.map((item) => (
              <Text key={item} style={styles.listItem}>
                - {item}
              </Text>
            ))}
            {pcc.latest.breakConditionNotes ? <Muted>{pcc.latest.breakConditionNotes}</Muted> : null}
          </Card>

          <Card>
            <SectionTitle>Event Timeline</SectionTitle>
            {events.length ? (
              <View style={styles.timeline}>
                {events.map((event) => (
                  <View key={event.id} style={styles.timelineRow}>
                    <View style={styles.row}>
                      <Text style={styles.eventType}>{event.eventType}</Text>
                      <Muted>{new Date(event.timestamp).toLocaleDateString()}</Muted>
                    </View>
                    <Muted>
                      Break triggered: {event.breakConditionTriggered ? "Yes" : "No"}
                    </Muted>
                    <Text style={styles.body}>{event.reasonText}</Text>
                    {event.eventType === "PANIC_SELL_SIMULATED" ? (
                      <Muted>
                        3m {event.regret3mPct ?? "n/a"}% • 6m {event.regret6mPct ?? "n/a"}% • 12m {event.regret12mPct ?? "n/a"}%
                      </Muted>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Muted>No events yet. Use the Sell Flow only when you feel pressure.</Muted>
            )}
          </Card>

          <Card>
            <PrimaryButton
              title="I Feel Like Selling"
              onPress={() => router.push(`/sell?ticker=${safeTicker}&region=${safeRegion}`)}
            />
            <SecondaryButton title="Open Stress Mode" onPress={() => router.push("/stress" as never)} />
            <SecondaryButton title="Edit PCC (new version)" onPress={() => router.push(`/pcc?ticker=${safeTicker}&region=${safeRegion}`)} />
          </Card>
        </ScrollView>
      ) : (
        <InlineNotice tone="act">{error || "Loading Owned detail..."}</InlineNotice>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 24
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  body: {
    color: colors.text,
    lineHeight: 20
  },
  listItem: {
    color: colors.text,
    fontSize: 14
  },
  timeline: {
    gap: 10
  },
  timelineRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#FFFCF6",
    gap: 5
  },
  eventType: {
    color: colors.text,
    fontWeight: "700"
  }
});
