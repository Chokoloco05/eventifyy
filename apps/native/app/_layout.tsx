import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import Providers from "@/components/providers";

export default function RootLayout() {
  return (
    <Providers>
      <Stack
        screenOptions={{
          animation: "slide_from_right",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#ffffff" },
          headerTitleStyle: { color: "#0f172a", fontWeight: "900" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Eventifyy" }} />
        <Stack.Screen name="community" options={{ title: "Communauté" }} />
        <Stack.Screen name="login" options={{ presentation: "modal", title: "Connexion" }} />
        <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
      </Stack>
      <StatusBar style="auto" />
    </Providers>
  );
}
