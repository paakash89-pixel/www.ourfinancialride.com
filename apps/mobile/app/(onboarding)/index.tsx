import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPut } from "../../lib/api";
import {
  Card,
  Chip,
  InlineNotice,
  Muted,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SegmentedControl,
  Title,
  colors
} from "../../components/ui";

export default function OnboardingScreen() {
  const router = useRouter();
  const [region, setRegion] = useState<"US" | "IN">("US");
  const [horizonYears, setHorizonYears] = useState("10");
  const [drawdownTolerance, setDrawdownTolerance] = useState<"20" | "40" | "60">("40");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const continueApp = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem("intrinsic_disclaimer_ack", new Date().toISOString());
      await AsyncStorage.setItem("intrinsic_default_horizon", horizonYears);
      await AsyncStorage.setItem("intrinsic_default_drawdown", drawdownTolerance);

      await apiPut("/me/profile", {
        region,
        currency: region === "IN" ? "INR" : "USD",
        disclaimerAccepted: true
      });

      router.replace("/home");
    } catch {
      setStatus("Could not save onboarding settings. You can continue and update in Settings.");
      router.replace("/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Chip>Behavioral Structure</Chip>
          <Title>Intrinsic</Title>
          <Muted>Educational + discipline coaching only. No stock tips, no trade execution.</Muted>
        </View>

        <Card>
          <Muted>Choose your default setup. You can update this anytime.</Muted>
          <SegmentedControl
            value={region}
            onChange={setRegion}
            options={[
              { label: "United States", value: "US" },
              { label: "India", value: "IN" }
            ]}
          />
          <TextInput
            value={horizonYears}
            onChangeText={setHorizonYears}
            keyboardType="numeric"
            placeholder="Default horizon years"
            placeholderTextColor="#7A7A7A"
            style={styles.input}
          />
          <SegmentedControl
            value={drawdownTolerance}
            onChange={setDrawdownTolerance}
            options={[
              { label: "20%", value: "20" },
              { label: "40%", value: "40" },
              { label: "60%", value: "60" }
            ]}
          />
        </Card>

        <InlineNotice tone="watch">
          Intrinsic is not investment advice and never provides buy/sell recommendations.
        </InlineNotice>

        <Card>
          <PrimaryButton
            title={loading ? "Saving..." : "I Understand, Continue"}
            onPress={continueApp}
            disabled={loading}
          />
          <SecondaryButton title="Create First PCC" onPress={() => router.push("/pcc")} />
        </Card>

        {status ? <InlineNotice tone="act">{status}</InlineNotice> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14
  },
  head: {
    gap: 6
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
  }
});
