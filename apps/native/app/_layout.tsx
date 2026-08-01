import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import Providers from "@/components/providers";

export default function RootLayout() {
  return (
    <Providers>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Eventifyy" }} />
        <Stack.Screen name="login" options={{ title: "Connexion" }} />
        <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
      </Stack>
      <StatusBar style="auto" />
    </Providers>
  );
}
