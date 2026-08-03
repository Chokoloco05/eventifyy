import { useMutation, useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { authClient } from "@/lib/auth-client";
import NativeButton from "@/components/native-button";
import Screen from "@/components/screen";
import TextField from "@/components/text-field";
import { queryClient, trpc } from "@/utils/trpc";
import { useCallback, useMemo, useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: "Musique",
  FOOD: "Food",
  TECH: "Tech",
  SPORT: "Sport",
  ART: "Art",
  NIGHTLIFE: "Nightlife",
  COMMUNITY: "Communauté",
};

const BRUSSELS_POINTS = [
  { label: "Centre", neighborhood: "Centre", address: "Grand-Place, 1000 Bruxelles", lat: 50.8467, lng: 4.3525 },
  { label: "Ixelles", neighborhood: "Ixelles", address: "Place Flagey, 1050 Ixelles", lat: 50.8276, lng: 4.3728 },
  { label: "Saint-Gilles", neighborhood: "Saint-Gilles", address: "Parvis de Saint-Gilles, 1060 Bruxelles", lat: 50.8301, lng: 4.3456 },
  { label: "Schaerbeek", neighborhood: "Schaerbeek", address: "Place Colignon, 1030 Schaerbeek", lat: 50.8676, lng: 4.3732 },
  { label: "Uccle", neighborhood: "Uccle", address: "Parvis Saint-Pierre, 1180 Uccle", lat: 50.8032, lng: 4.3373 },
];

const DEFAULT_POINT = BRUSSELS_POINTS[0]!;

function toLocalDateTimeInput(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fr-BE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function DashboardScreen() {
  const router = useRouter();
  const session = authClient.useSession();
  const categories = useQuery(trpc.eventCategories.queryOptions());
  const myEvents = useQuery({
    ...trpc.myEvents.queryOptions(),
    enabled: Boolean(session.data?.user),
  });

  const defaultStart = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(19, 0, 0, 0);
    return toLocalDateTimeInput(date);
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("MUSIC");
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [venueName, setVenueName] = useState("");
  const [capacity, setCapacity] = useState("80");
  const [price, setPrice] = useState("0");
  const [pointIndex, setPointIndex] = useState(0);

  const createEvent = useMutation(
    trpc.createEvent.mutationOptions({
      onSuccess: async () => {
        Alert.alert("Événement créé", "Il apparaît maintenant dans l'exploration.");
        setTitle("");
        setDescription("");
        setVenueName("");
        await myEvents.refetch();
        await queryClient.invalidateQueries();
      },
      onError: (error) => Alert.alert("Création impossible", error.message),
    }),
  );

  const isRefreshing = categories.isRefetching || myEvents.isRefetching;

  const handleRefresh = useCallback(async () => {
    await Promise.all([categories.refetch(), myEvents.refetch()]);
  }, [categories, myEvents]);

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

  function handleCreateEvent() {
    if (!title || !description || !venueName || !startsAt) {
      Alert.alert("Formulaire incomplet", "Renseigne au minimum le titre, la description, le lieu et la date.");
      return;
    }

    const point = BRUSSELS_POINTS[pointIndex] ?? DEFAULT_POINT;

    createEvent.mutate({
      title,
      description,
      category: category as never,
      startsAt: new Date(startsAt).toISOString(),
      venueName,
      address: point.address,
      neighborhood: point.neighborhood,
      latitude: point.lat,
      longitude: point.lng,
      capacity: Number(capacity),
      priceCents: Math.round(Number(price) * 100),
      coverImage: "",
    });
  }

  return (
    <Screen onRefresh={handleRefresh} refreshing={isRefreshing}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Dashboard Eventifyy</Text>
        <Text style={styles.title}>Bonjour {session.data.user.name}</Text>
        <Text style={styles.subtitle}>Publie tes sorties, suis les inscriptions et garde tes réservations au même endroit.</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeading}>
          <Text style={styles.panelTitle}>Créer un événement</Text>
          <Text style={styles.panelHint}>Bruxelles</Text>
        </View>
        <TextField label="Titre" onChangeText={setTitle} placeholder="Afterwork Bruxelles" value={title} />
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            multiline
            onChangeText={setDescription}
            placeholder="Ambiance, public, programme..."
            style={[styles.input, styles.textArea]}
            value={description}
          />
        </View>
        <TextField label="Date ISO locale" onChangeText={setStartsAt} placeholder="2026-08-15T19:00" value={startsAt} />
        <TextField label="Lieu" onChangeText={setVenueName} placeholder="Nom du lieu" value={venueName} />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="Capacité" onChangeText={setCapacity} value={capacity} />
          </View>
          <View style={styles.flex}>
            <TextField label="Prix EUR" onChangeText={setPrice} value={price} />
          </View>
        </View>

        <Text style={styles.label}>Catégorie</Text>
        <View style={styles.chips}>
          {(categories.data ?? []).map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setCategory(item.value)}
              style={[styles.chip, category === item.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Quartier</Text>
        <View style={styles.chips}>
          {BRUSSELS_POINTS.map((point, index) => (
            <Pressable
              key={point.label}
              onPress={() => setPointIndex(index)}
              style={[styles.chip, pointIndex === index && styles.chipActive]}
            >
              <Text style={[styles.chipText, pointIndex === index && styles.chipTextActive]}>
                {point.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <NativeButton disabled={createEvent.isPending} onPress={handleCreateEvent}>
          {createEvent.isPending ? "Création..." : "Publier"}
        </NativeButton>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Mes réservations</Text>
        {myEvents.data?.registrations.length === 0 ? (
          <Text style={styles.muted}>Aucune réservation pour le moment.</Text>
        ) : null}
        {myEvents.data?.registrations.map(({ event, id }) => (
          <View key={id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{event.title}</Text>
            <Text style={styles.itemMeta}>{formatDate(event.startsAt)}</Text>
            <Text style={styles.itemMeta}>{event.venueName}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Mes événements organisés</Text>
        {myEvents.data?.organized.length === 0 ? (
          <Text style={styles.muted}>Aucun événement créé.</Text>
        ) : null}
        {myEvents.data?.organized.map((event) => (
          <View key={event.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{event.title}</Text>
            <Text style={styles.itemMeta}>{CATEGORY_LABELS[event.category]} - {formatDate(event.startsAt)}</Text>
            <Text style={styles.itemMeta}>
              {event.attendeeCount}/{event.capacity} inscrits
            </Text>
          </View>
        ))}
      </View>

      <NativeButton onPress={handleSignOut} variant="secondary">
        Déconnexion
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
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 20,
    padding: 18,
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  panelTitle: {
    color: "#0f172a",
    fontSize: 19,
    fontWeight: "900",
  },
  panelHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  panelHint: {
    backgroundColor: "#f0fdfa",
    borderRadius: 999,
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  field: {
    gap: 8,
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  textArea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderColor: "#cbd5e1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e",
  },
  chipText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  listItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    gap: 4,
    padding: 12,
  },
  itemTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  itemMeta: {
    color: "#64748b",
    fontSize: 14,
  },
});
