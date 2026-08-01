import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import NativeButton from "@/components/native-button";
import Screen from "@/components/screen";
import { trpc } from "@/utils/trpc";

export default function HomeScreen() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Eventifyy</Text>
        <Text style={styles.title}>Mobile starter</Text>
        <Text style={styles.body}>
          Version mobile alignee avec la base web : API status, authentification et dashboard.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>API Status</Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, healthCheck.data ? styles.connected : styles.disconnected]} />
          <Text style={styles.statusText}>
            {healthCheck.isLoading ? "Checking..." : healthCheck.data ? "Connected" : "Disconnected"}
          </Text>
        </View>
      </View>

      <Link href="/login" asChild>
        <NativeButton onPress={() => {}}>Login / Sign up</NativeButton>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 16,
    paddingTop: 48,
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: "#111827",
    fontSize: 32,
    fontWeight: "800",
  },
  body: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  panelTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "600",
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  connected: {
    backgroundColor: "#22c55e",
  },
  disconnected: {
    backgroundColor: "#ef4444",
  },
  statusText: {
    color: "#475569",
    fontSize: 15,
  },
});
