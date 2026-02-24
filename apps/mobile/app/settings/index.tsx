import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { apiGet, apiPost, apiPut } from "../../lib/api";
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
  privateMode?: boolean;
  concentrationLabel?: "BALANCED" | "FOCUSED" | "EXTREME";
  concentrationAcknowledged?: boolean;
};

type Entitlements = {
  plan: "EXPLORER" | "OWNER";
  limits: {
    pccLimit: number | null;
  };
};

export default function SettingsScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([apiGet<Profile>("/me/profile"), apiGet<Entitlements>("/me/entitlements")])
      .then(([p, e]) => {
        setProfile(p);
        setEntitlements(e);
      })
      .catch(() => {
        setProfile({ region: "US", privateMode: true, concentrationLabel: "BALANCED" });
      });
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setStatus("");
    try {
      await apiPut("/me/profile", {
        region: profile.region,
        privateMode: profile.privateMode ?? false,
        concentrationLabel: profile.concentrationLabel ?? "BALANCED",
        concentrationAcknowledged: profile.concentrationAcknowledged ?? false,
        aiMemoryOptIn: false,
        disclaimerAccepted: true
      });
      setStatus("Settings saved.");
    } catch {
      setStatus("Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      await apiPost("/me/export", {});
      setStatus("Data export generated.");
    } catch {
      setStatus("Could not export data.");
    }
  };

  const deleteAccount = async () => {
    try {
      await apiPost("/me/delete", { scope: "account" });
      setStatus("Account data deleted.");
    } catch {
      setStatus("Could not delete account data.");
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Title>Settings</Title>

        <Card>
          <SectionTitle>Disclosure</SectionTitle>
          <Muted>Educational + behavioral coaching only. No buy/sell advice and no guarantees.</Muted>
        </Card>

        {profile ? (
          <Card>
            <SectionTitle>Region Preference</SectionTitle>
            <SegmentedControl
              value={profile.region}
              onChange={(value) => setProfile({ ...profile, region: value })}
              options={[
                { label: "United States", value: "US" },
                { label: "India", value: "IN" }
              ]}
            />
          </Card>
        ) : null}

        {profile ? (
          <Card>
            <View style={styles.headRow}>
              <SectionTitle>Privacy Mode</SectionTitle>
              <Chip>{profile.privateMode ? "Private" : "Standard"}</Chip>
            </View>
            <Pressable
              onPress={() => setProfile({ ...profile, privateMode: !profile.privateMode })}
              style={styles.toggle}
            >
              <Text style={styles.toggleLabel}>Private mode</Text>
              <Text style={styles.toggleValue}>{profile.privateMode ? "ON" : "OFF"}</Text>
            </Pressable>
          </Card>
        ) : null}

        {profile ? (
          <Card>
            <SectionTitle>Concentration Guardrail</SectionTitle>
            <SegmentedControl
              value={profile.concentrationLabel ?? "BALANCED"}
              onChange={(value) =>
                setProfile({
                  ...profile,
                  concentrationLabel: value,
                  concentrationAcknowledged:
                    value === "EXTREME" ? profile.concentrationAcknowledged ?? false : false
                })
              }
              options={[
                { label: "Balanced", value: "BALANCED" },
                { label: "Focused", value: "FOCUSED" },
                { label: "Extreme", value: "EXTREME" }
              ]}
            />
            {profile.concentrationLabel === "EXTREME" ? (
              <Pressable
                onPress={() =>
                  setProfile({
                    ...profile,
                    concentrationAcknowledged: !profile.concentrationAcknowledged
                  })
                }
                style={styles.toggle}
              >
                <Text style={styles.toggleLabel}>I acknowledge concentration risk</Text>
                <Text style={styles.toggleValue}>
                  {profile.concentrationAcknowledged ? "YES" : "NO"}
                </Text>
              </Pressable>
            ) : null}
          </Card>
        ) : null}

        {entitlements ? (
          <Card>
            <SectionTitle>Subscription</SectionTitle>
            <Muted>
              {entitlements.plan} • PCC limit: {entitlements.limits.pccLimit ?? "Unlimited"}
            </Muted>
          </Card>
        ) : null}

        <Card>
          <SectionTitle>Data Controls</SectionTitle>
          <SecondaryButton title="Export Data" onPress={exportData} />
          <SecondaryButton title="Delete Account Data" onPress={deleteAccount} />
        </Card>

        <PrimaryButton title={saving ? "Saving..." : "Save Settings"} onPress={save} disabled={saving} />
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
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  toggle: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#FFFEFC",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  toggleLabel: {
    color: colors.text,
    fontWeight: "600"
  },
  toggleValue: {
    color: colors.text,
    fontWeight: "700"
  }
});
