import { Link } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useCallback, useMemo, useState } from "react";

import type { AppRouter } from "@eventifyy/api/routers/index";

import { authClient } from "@/lib/auth-client";
import NativeButton from "@/components/native-button";
import Screen from "@/components/screen";
import { queryClient, trpc } from "@/utils/trpc";

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: "Musique",
  FOOD: "Food",
  TECH: "Tech",
  SPORT: "Sport",
  ART: "Art",
  NIGHTLIFE: "Nightlife",
  COMMUNITY: "Communauté",
};

const CATEGORY_COLORS: Record<string, string> = {
  MUSIC: "#c026d3",
  FOOD: "#ea580c",
  TECH: "#0284c7",
  SPORT: "#65a30d",
  ART: "#7c3aed",
  NIGHTLIFE: "#e11d48",
  COMMUNITY: "#0f766e",
};

type NativeEvent = inferRouterOutputs<AppRouter>["events"][number];

function updateRegistration<T extends NativeEvent>(events: T[] | undefined, eventId: string, isRegistered: boolean) {
  return events?.map((event) => {
    if (event.id !== eventId) {
      return event;
    }

    const attendeeCount = Math.max(0, event.attendeeCount + (isRegistered ? 1 : -1));

    return {
      ...event,
      attendeeCount,
      isFull: attendeeCount >= event.capacity,
      isRegistered,
      canRegister: !isRegistered && attendeeCount < event.capacity && new Date(event.startsAt).getTime() >= Date.now(),
    };
  });
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fr-BE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(priceCents: number) {
  return priceCents === 0 ? "Gratuit" : `${(priceCents / 100).toFixed(2).replace(".", ",")} EUR`;
}

export default function HomeScreen() {
  const session = authClient.useSession();
  const [category, setCategory] = useState("ALL");
  const [query, setQuery] = useState("");

  const filters = useMemo(
    () => ({
      category: category === "ALL" ? undefined : (category as never),
      query: query.trim() || undefined,
      onlyUpcoming: true,
    }),
    [category, query],
  );

  const eventQueryOptions = trpc.events.queryOptions(filters);
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const categories = useQuery(trpc.eventCategories.queryOptions());
  const events = useQuery(eventQueryOptions);

  const registerMutation = useMutation(
    trpc.registerForEvent.mutationOptions({
      onMutate: async ({ eventId }) => {
        await queryClient.cancelQueries({ queryKey: eventQueryOptions.queryKey });
        const previousEvents = queryClient.getQueryData<NativeEvent[]>(eventQueryOptions.queryKey);
        queryClient.setQueryData<NativeEvent[]>(eventQueryOptions.queryKey, (current) =>
          updateRegistration(current, eventId, true),
        );
        return { previousEvents };
      },
      onSuccess: () => {
        Alert.alert("Réservation confirmée", "Tu es inscrit à cet événement.");
      },
      onError: (error, _variables, context) => {
        queryClient.setQueryData(eventQueryOptions.queryKey, context?.previousEvents);
        Alert.alert("Réservation impossible", error.message);
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: eventQueryOptions.queryKey });
      },
    }),
  );

  const unregisterMutation = useMutation(
    trpc.unregisterFromEvent.mutationOptions({
      onMutate: async ({ eventId }) => {
        await queryClient.cancelQueries({ queryKey: eventQueryOptions.queryKey });
        const previousEvents = queryClient.getQueryData<NativeEvent[]>(eventQueryOptions.queryKey);
        queryClient.setQueryData<NativeEvent[]>(eventQueryOptions.queryKey, (current) =>
          updateRegistration(current, eventId, false),
        );
        return { previousEvents };
      },
      onSuccess: () => {
        Alert.alert("Réservation annulée");
      },
      onError: (error, _variables, context) => {
        queryClient.setQueryData(eventQueryOptions.queryKey, context?.previousEvents);
        Alert.alert("Action impossible", error.message);
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: eventQueryOptions.queryKey });
      },
    }),
  );

  const eventList = (events.data ?? []) as NativeEvent[];
  const availableSpots = eventList.reduce((sum, event) => sum + Math.max(0, event.capacity - event.attendeeCount), 0);
  const isRefreshing = healthCheck.isRefetching || categories.isRefetching || events.isRefetching;

  const handleRefresh = useCallback(async () => {
    await Promise.all([healthCheck.refetch(), categories.refetch(), events.refetch()]);
  }, [categories, events, healthCheck]);

  const handleShareEvent = useCallback(async (event: NativeEvent) => {
    await Share.share({
      title: event.title,
      message: `${event.title}\n${formatDate(event.startsAt)}\n${event.venueName} - ${event.neighborhood}\nDécouvre cet event sur Eventifyy.`,
    });
  }, []);

  return (
    <Screen onRefresh={handleRefresh} refreshing={isRefreshing}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.eyebrow}>Eventifyy Bruxelles</Text>
            <Text style={styles.title}>Tes sorties, plus simples.</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.dot, healthCheck.data ? styles.connected : styles.disconnected]} />
            <Text style={styles.statusText}>{healthCheck.data ? "Connectée" : "Hors ligne"}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Explore les événements, réserve ta place et publie tes propres sorties depuis le dashboard.
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{eventList.length}</Text>
            <Text style={styles.statLabel}>events</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{availableSpots}</Text>
            <Text style={styles.statLabel}>places</Text>
          </View>
        </View>
      </View>

      <Link href={session.data?.user ? "/dashboard" : "/login"} asChild>
        <NativeButton onPress={() => {}}>
          {session.data?.user ? "Créer / dashboard" : "Login / Sign up"}
        </NativeButton>
      </Link>
      <Link href="/community" asChild>
        <NativeButton onPress={() => {}} variant="ghost">
          Comprendre la communauté
        </NativeButton>
      </Link>

      <View style={styles.searchPanel}>
        <TextInput
          onChangeText={setQuery}
          placeholder="Chercher un event, lieu, quartier..."
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          value={query}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            <Pressable onPress={() => setCategory("ALL")} style={[styles.chip, category === "ALL" && styles.chipActive]}>
              <Text style={[styles.chipText, category === "ALL" && styles.chipTextActive]}>Tous</Text>
            </Pressable>
            {(categories.data ?? []).map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setCategory(item.value)}
                style={[styles.chip, category === item.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === item.value && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Événements à venir</Text>
        <Text style={styles.sectionMeta}>{eventList.length} trouvés</Text>
      </View>

      {events.isLoading ? <Text style={styles.muted}>Chargement des événements...</Text> : null}
      {events.isError ? <Text style={styles.errorText}>Impossible de charger les événements.</Text> : null}
      {!events.isLoading && eventList.length === 0 ? (
        <Text style={styles.muted}>Aucun événement publié pour ces filtres.</Text>
      ) : null}

      {eventList.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventTop}>
            <View style={[styles.badge, { backgroundColor: CATEGORY_COLORS[event.category] ?? "#0f766e" }]}>
              <Text style={styles.badgeText}>{CATEGORY_LABELS[event.category]}</Text>
            </View>
            <Text style={styles.price}>{formatPrice(event.priceCents)}</Text>
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>
          <View style={styles.metaPanel}>
            <Text style={styles.eventMeta}>{formatDate(event.startsAt)}</Text>
            <Text style={styles.eventMeta}>
              {event.venueName} - {event.neighborhood}
            </Text>
            <Text style={styles.eventMeta}>
              {event.attendeeCount}/{event.capacity} participants
            </Text>
          </View>
          <Pressable onPress={() => handleShareEvent(event)} style={({ pressed }) => [styles.shareAction, pressed && styles.pressed]}>
            <Text style={styles.shareActionText}>Partager</Text>
          </Pressable>
          {session.data?.user ? (
            !event.isRegistered && !event.canRegister && event.lockedReason ? (
              <View style={styles.lockedPanel}>
                <Text style={styles.lockedText}>{event.lockedReason}</Text>
                <Link href="/dashboard" asChild>
                  <NativeButton onPress={() => {}}>Débloquer mon accès</NativeButton>
                </Link>
              </View>
            ) : (
              <Pressable
                disabled={registerMutation.isPending || unregisterMutation.isPending || event.isFull}
                onPress={() =>
                  event.isRegistered
                    ? unregisterMutation.mutate({ eventId: event.id })
                    : registerMutation.mutate({ eventId: event.id })
                }
                style={({ pressed }) => [
                  styles.eventAction,
                  event.isRegistered && styles.eventActionSecondary,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.eventActionText, event.isRegistered && styles.eventActionTextSecondary]}>
                  {event.isRegistered ? "Annuler ma réservation" : event.isFull ? "Complet" : "Participer"}
                </Text>
              </Pressable>
            )
          ) : (
            <Link href="/login" asChild>
              <NativeButton onPress={() => {}}>Se connecter pour participer</NativeButton>
            </Link>
          )}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    marginTop: 20,
    padding: 18,
  },
  heroTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35,
    marginTop: 6,
    maxWidth: 230,
  },
  subtitle: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  statusPill: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dot: {
    borderRadius: 5,
    height: 9,
    width: 9,
  },
  connected: {
    backgroundColor: "#22c55e",
  },
  disconnected: {
    backgroundColor: "#ef4444",
  },
  statusText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    flex: 1,
    padding: 12,
  },
  statNumber: {
    color: "#0f172a",
    fontSize: 25,
    fontWeight: "900",
  },
  statLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  searchPanel: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  searchInput: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 10,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 10,
  },
  chip: {
    borderColor: "#cbd5e1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  chipText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
  },
  sectionMeta: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "800",
  },
  muted: {
    color: "#64748b",
    fontSize: 15,
  },
  errorText: {
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    color: "#991b1b",
    fontSize: 14,
    fontWeight: "800",
    padding: 12,
  },
  eventCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  eventTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  price: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "900",
  },
  eventTitle: {
    color: "#0f172a",
    fontSize: 21,
    fontWeight: "900",
  },
  eventDescription: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
  },
  metaPanel: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    gap: 5,
    padding: 12,
  },
  eventMeta: {
    color: "#334155",
    fontSize: 14,
  },
  shareAction: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
  },
  shareActionText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  lockedPanel: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  lockedText: {
    color: "#78350f",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  eventAction: {
    alignItems: "center",
    backgroundColor: "#0f766e",
    borderRadius: 10,
    minHeight: 46,
    justifyContent: "center",
  },
  eventActionSecondary: {
    backgroundColor: "#e2e8f0",
  },
  eventActionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  eventActionTextSecondary: {
    color: "#0f172a",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
