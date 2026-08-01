import { useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { authClient } from "@/lib/auth-client";
import NativeButton from "@/components/native-button";
import Screen from "@/components/screen";
import { queryClient, trpc } from "@/utils/trpc";

export default function DashboardScreen() {
  const router = useRouter();
  const session = authClient.useSession();
  const privateData = useQuery({
    ...trpc.privateData.queryOptions(),
    enabled: Boolean(session.data?.user),
  });

  if (session.isPending) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={styles.muted}>Chargement de la session...</Text>
        </View>
      </Screen>
    );
  }

  if (!session.data?.user) {
    return <Redirect href="/login" />;
  }

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          queryClient.clear();
          router.replace("/");
        },
      },
    });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Dashboard</Text>
        <Text style={styles.title}>Welcome {session.data.user.name}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>API privee</Text>
        <Text style={styles.value}>
          {privateData.isLoading ? "Chargement..." : privateData.data?.message ?? "Non connecte"}
        </Text>
      </View>

      <NativeButton onPress={handleSignOut} variant="secondary">
        Sign out
      </NativeButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
  },
  muted: {
    color: "#64748b",
    fontSize: 15,
  },
  header: {
    gap: 8,
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
    fontSize: 30,
    fontWeight: "800",
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
    marginBottom: 8,
  },
  value: {
    color: "#475569",
    fontSize: 15,
  },
});
