import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Chip, Muted, Screen, Title, colors } from "../../components/ui";

const toNum = (value: string): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const horizonList = [10, 20, 30];

const projectValue = (principal: number, monthly: number, annualRatePct: number, years: number) => {
  const r = annualRatePct / 100 / 12;
  const months = Math.max(0, years * 12);
  let total = principal;
  let invested = principal;

  for (let i = 0; i < months; i += 1) {
    total = (total + monthly) * (1 + r);
    invested += monthly;
  }

  return {
    total,
    invested,
    gain: total - invested
  };
};

const normalize = (values: number[]): number[] => {
  if (!values.length) return [];
  const max = Math.max(...values);
  if (max <= 0) return values.map(() => 0);
  return values.map((value) => value / max);
};

export default function SimulatorScreen() {
  const [region, setRegion] = useState<"US" | "IN">("US");
  const [principal, setPrincipal] = useState("100000");
  const [monthly, setMonthly] = useState("1000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("20");

  const currency = region === "IN" ? "INR" : "USD";
  const locale = region === "IN" ? "en-IN" : "en-US";

  const formatCurrency = (value: number): string => {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0
      }).format(Math.round(value));
    } catch {
      return `${currency} ${Math.round(value).toLocaleString()}`;
    }
  };

  const projectionSeries = useMemo(() => {
    const p = Math.max(0, toNum(principal));
    const m = Math.max(0, toNum(monthly));
    const annual = Math.max(-50, toNum(rate));
    const yearsNum = Math.max(1, Math.min(50, Math.round(toNum(years))));

    const series: Array<{ year: number; total: number; invested: number; gain: number }> = [];
    for (let year = 0; year <= yearsNum; year += 1) {
      const value = projectValue(p, m, annual, year);
      series.push({
        year,
        total: value.total,
        invested: value.invested,
        gain: value.gain
      });
    }
    return series;
  }, [principal, monthly, rate, years]);

  const output = projectionSeries[projectionSeries.length - 1] ?? {
    total: 0,
    invested: 0,
    gain: 0
  };

  const horizonSeries = useMemo(() => {
    const p = Math.max(0, toNum(principal));
    const m = Math.max(0, toNum(monthly));
    const annual = Math.max(-50, toNum(rate));
    return horizonList.map((horizon) => {
      const value = projectValue(p, m, annual, horizon);
      return {
        horizon,
        total: value.total
      };
    });
  }, [principal, monthly, rate]);

  const chartBars = useMemo(() => {
    const sampled = projectionSeries.filter((item, idx) => {
      if (item.year === 0) return true;
      return idx % 2 === 0 || idx === projectionSeries.length - 1;
    });
    const normalized = normalize(sampled.map((item) => item.total));
    return sampled.map((item, idx) => ({
      year: item.year,
      total: item.total,
      normalized: normalized[idx] ?? 0
    }));
  }, [projectionSeries]);

  const setOwnerPreset = (targetRegion: "US" | "IN") => {
    setRegion(targetRegion);
    if (targetRegion === "US") {
      setPrincipal("100000");
      setMonthly("1000");
    } else {
      setPrincipal("1000000");
      setMonthly("10000");
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Owner-Style Compounding Simulator</Title>
        <Muted>Educational estimate. Not a promise of returns.</Muted>

        <Card>
          <Text style={styles.sectionTitle}>Owner mindset inputs</Text>
          <Muted>
            Think like owning the business for 10, 20, or 30 years with steady investing.
          </Muted>
          <View style={styles.segmented}>
            <Pressable
              onPress={() => setRegion("US")}
              style={[styles.segmentBtn, region === "US" && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, region === "US" && styles.segmentTextActive]}>
                US (USD)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRegion("IN")}
              style={[styles.segmentBtn, region === "IN" && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, region === "IN" && styles.segmentTextActive]}>
                India (INR)
              </Text>
            </Pressable>
          </View>
          <View style={styles.presetRow}>
            <Pressable style={styles.presetBtn} onPress={() => setOwnerPreset("US")}>
              <Text style={styles.presetText}>Owner Example: $100k</Text>
            </Pressable>
            <Pressable style={styles.presetBtn} onPress={() => setOwnerPreset("IN")}>
              <Text style={styles.presetText}>Owner Example: ₹10L</Text>
            </Pressable>
          </View>
          <View style={styles.horizonRow}>
            {horizonList.map((horizon) => (
              <Pressable
                key={horizon}
                style={[styles.horizonBtn, Number(years) === horizon && styles.horizonBtnActive]}
                onPress={() => setYears(String(horizon))}
              >
                <Text
                  style={[
                    styles.horizonText,
                    Number(years) === horizon && styles.horizonTextActive
                  ]}
                >
                  {horizon}Y
                </Text>
              </Pressable>
            ))}
          </View>
          <Field label="Initial investment" value={principal} onChange={setPrincipal} />
          <Field label="Monthly contribution" value={monthly} onChange={setMonthly} />
          <Field label="Expected annual return %" value={rate} onChange={setRate} />
          <Field label="Horizon years" value={years} onChange={setYears} />
        </Card>

        <Card>
          <View style={styles.resultHead}>
            <Text style={styles.sectionTitle}>Projection at {years} years</Text>
            <Chip>Estimate</Chip>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Estimated value</Text>
            <Text style={styles.metricValue}>{formatCurrency(output.total)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total invested</Text>
            <Text style={styles.metricValue}>{formatCurrency(output.invested)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Gain</Text>
            <Text style={styles.metricValue}>{formatCurrency(output.gain)}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Growth chart by year</Text>
          <Muted>Each bar is projected portfolio value at that year.</Muted>
          <View style={styles.chartRow}>
            {chartBars.map((item) => (
              <View key={`bar-${item.year}`} style={styles.chartCol}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: Math.max(6, item.normalized * 120)
                    }
                  ]}
                />
                <Text style={styles.chartLabel}>{item.year}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>10Y / 20Y / 30Y snapshots</Text>
          {horizonSeries.map((item) => (
            <View key={`horizon-${item.horizon}`} style={styles.metricRow}>
              <Text style={styles.metricLabel}>{item.horizon} years</Text>
              <Text style={styles.metricValue}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor="#7a8aa2"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 24
  },
  sectionTitle: {
    fontWeight: "700",
    color: colors.text
  },
  segmented: {
    flexDirection: "row",
    gap: 8
  },
  segmentBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff"
  },
  segmentBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: "#c4d8f8"
  },
  segmentText: {
    color: colors.muted,
    fontWeight: "700"
  },
  segmentTextActive: {
    color: colors.primaryStrong
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  presetBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  presetText: {
    color: colors.primaryStrong,
    fontWeight: "700"
  },
  horizonRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  horizonBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "#fff"
  },
  horizonBtnActive: {
    borderColor: "#b7d1f4",
    backgroundColor: "#eaf3ff"
  },
  horizonText: {
    color: colors.muted,
    fontWeight: "700"
  },
  horizonTextActive: {
    color: colors.primaryStrong
  },
  field: {
    gap: 6
  },
  fieldLabel: {
    fontWeight: "600",
    color: colors.text
  },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: colors.text
  },
  resultHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomColor: "#e3eaf7",
    borderBottomWidth: 1,
    paddingVertical: 7
  },
  metricLabel: {
    color: colors.muted
  },
  metricValue: {
    color: colors.text,
    fontWeight: "700"
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    minHeight: 135
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4
  },
  chartBar: {
    width: "100%",
    borderRadius: 4,
    backgroundColor: "#1d7bf0"
  },
  chartLabel: {
    fontSize: 11,
    color: colors.muted
  }
});
