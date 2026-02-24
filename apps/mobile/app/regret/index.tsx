import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { apiGet } from "../../lib/api";
import {
  Card,
  InlineNotice,
  Muted,
  Screen,
  SectionTitle,
  Title,
  colors
} from "../../components/ui";

type RegretLedger = {
  currency: string;
  aggregates: {
    panicEventsCount: number;
    holdEventsCount: number;
    lifetimeRegretCostEstimate: number;
    holdStreakDays: number;
    bestHoldStreakDays: number;
  };
  entries: Array<{
    id: string;
    ticker: string;
    region: "US" | "IN";
    eventType: "PANIC_SELL_SIMULATED" | "HELD";
    timestamp: string;
    reasonText: string;
    breakConditionTriggered: boolean;
    regret12mPct: number | null;
    regretCostAmount: number | null;
  }>;
};

export default function RegretScreen() {
  const [ledger, setLedger] = useState<RegretLedger | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<RegretLedger>("/me/regret")
      .then(setLedger)
      .catch(() => setError("Could not load regret ledger."));
  }, []);

  return (
    <Screen>
      <Title>Regret Ledger</Title>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {ledger ? (
          <>
            <Card>
              <SectionTitle>Aggregates</SectionTitle>
              <Muted>
                Panic simulations: {ledger.aggregates.panicEventsCount} • Held events: {ledger.aggregates.holdEventsCount}
              </Muted>
              <Muted>
                Hold streak: {ledger.aggregates.holdStreakDays} days • Best streak: {ledger.aggregates.bestHoldStreakDays} days
              </Muted>
              <Muted>
                Lifetime regret estimate: {ledger.currency} {ledger.aggregates.lifetimeRegretCostEstimate.toFixed(2)}
              </Muted>
            </Card>

            {ledger.entries.map((entry) => (
              <Card key={entry.id}>
                <View style={styles.row}>
                  <SectionTitle>{entry.ticker}</SectionTitle>
                  <Text style={styles.type}>{entry.eventType}</Text>
                </View>
                <Muted>
                  {new Date(entry.timestamp).toLocaleString()} • {entry.region} • Break triggered: {entry.breakConditionTriggered ? "Yes" : "No"}
                </Muted>
                <Text style={styles.reason}>{entry.reasonText}</Text>
                <Muted>
                  12m counterfactual: {entry.regret12mPct ?? "n/a"}% ({ledger.currency} {entry.regretCostAmount ?? "n/a"})
                </Muted>
              </Card>
            ))}
          </>
        ) : (
          <InlineNotice tone={error ? "act" : "watch"}>
            {error || "Loading regret ledger..."}
          </InlineNotice>
        )}
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between"
  },
  type: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12
  },
  reason: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21
  }
});
