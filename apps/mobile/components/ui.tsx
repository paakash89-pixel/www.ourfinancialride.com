import type { PropsWithChildren } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const colors = {
  background: "#F6F3EC",
  canvas: "#F1EEE6",
  card: "#FFFEFC",
  border: "#D8D1C0",
  text: "#0B1C2D",
  muted: "#566473",
  primary: "#0B1C2D",
  primaryStrong: "#0B1C2D",
  primarySoft: "#E4E9EE",
  accent: "#C9A227",
  steadyBg: "#E8EEF3",
  steadyText: "#2B4156",
  watchBg: "#F2E8D0",
  watchText: "#6D5421",
  actBg: "#F1E3E4",
  actText: "#6C4549"
};

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
      {children}
    </SafeAreaView>
  );
}

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function Title({ children }: PropsWithChildren) {
  return <Text style={styles.title}>{children}</Text>;
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function PrimaryButton({
  title,
  disabled,
  onPress
}: {
  title: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        pressed ? styles.buttonPressed : undefined,
        disabled ? styles.buttonDisabled : undefined
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={styles.primaryText}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  disabled,
  onPress
}: {
  title: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.secondaryButton,
        pressed ? styles.buttonPressed : undefined,
        disabled ? styles.buttonDisabled : undefined
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.secondaryText}>{title}</Text>
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segmentOption,
              active ? styles.segmentOptionActive : undefined,
              pressed ? styles.buttonPressed : undefined
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                active ? styles.segmentTextActive : undefined
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Muted({ children }: PropsWithChildren) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Chip({ children }: PropsWithChildren) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{children}</Text>
    </View>
  );
}

export function InlineNotice({
  tone = "steady",
  children
}: PropsWithChildren<{ tone?: "steady" | "watch" | "act" }>) {
  return (
    <View
      style={[
        styles.notice,
        tone === "watch" ? styles.noticeWatch : undefined,
        tone === "act" ? styles.noticeAct : undefined
      ]}
    >
      <Text
        style={[
          styles.noticeText,
          tone === "watch" ? styles.noticeTextWatch : undefined,
          tone === "act" ? styles.noticeTextAct : undefined
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#0B1C2D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
    gap: 8
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.7
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryText: {
    color: "#F8F4EA",
    fontWeight: "600",
    fontSize: 16
  },
  secondaryButton: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 16
  },
  segmented: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderWidth: 1
  },
  segmentOption: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentOptionActive: {
    backgroundColor: "#FFFCF5",
    shadowColor: "#0B1C2D",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1
  },
  segmentText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500"
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: "700"
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: "#F0E8D2",
    borderColor: "#D2BE82",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  chipText: {
    color: "#5E4B18",
    fontSize: 12,
    fontWeight: "700"
  },
  notice: {
    borderColor: "#C5D3DF",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: colors.steadyBg,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  noticeWatch: {
    borderColor: "#D7BF83",
    backgroundColor: colors.watchBg
  },
  noticeAct: {
    borderColor: "#D5B2B5",
    backgroundColor: colors.actBg
  },
  noticeText: {
    color: colors.steadyText,
    fontWeight: "600",
    fontSize: 14
  },
  noticeTextWatch: {
    color: colors.watchText
  },
  noticeTextAct: {
    color: colors.actText
  },
  buttonPressed: {
    opacity: 0.88
  },
  buttonDisabled: {
    opacity: 0.5
  }
});
