import type { ComponentType } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";

export default function RootLayout() {
  const AppStack = Stack as unknown as ComponentType<any>;

  return (
    <AppStack
      screenOptions={{
        headerStyle: { backgroundColor: "#F6F3EC" },
        headerShadowVisible: false,
        headerTitleStyle: { color: "#0B1C2D", fontWeight: "700", fontSize: 17 },
        headerLargeTitleStyle: { color: "#0B1C2D", fontWeight: "700" },
        headerLargeTitle: Platform.OS === "ios",
        contentStyle: { backgroundColor: "#F6F3EC" }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)/index" options={{ headerShown: false }} />
      <Stack.Screen name="home/index" options={{ title: "Intrinsic" }} />
      <Stack.Screen name="stress/index" options={{ title: "Stress Mode" }} />
      <Stack.Screen name="pcc/index" options={{ title: "Your PCC" }} />
      <Stack.Screen name="sell/index" options={{ title: "I Feel Like Selling" }} />
      <Stack.Screen name="regret/index" options={{ title: "Regret Ledger" }} />
      <Stack.Screen name="company/[ticker]/index" options={{ title: "Owned Detail" }} />
      <Stack.Screen name="settings/index" options={{ title: "Settings" }} />
    </AppStack>
  );
}
