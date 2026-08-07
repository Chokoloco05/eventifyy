import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import NativeButton from "@/components/native-button";
import Screen from "@/components/screen";

const principles = [
  "Contribuer avant de participer.",
  "Proposer une vraie sortie avant de réserver chez les autres.",
  "Construire un cercle plus impliqué que les plateformes ouvertes classiques.",
] as const;

export default function CommunityScreen() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Communauté Eventifyy</Text>
        <Text style={styles.title}>Un cercle sélectif pour ceux qui créent aussi.</Text>
        <Text style={styles.subtitle}>
          Eventifyy repose sur la réciprocité : tu peux explorer les sorties, mais tu dois publier au moins un
          événement pour réserver une place chez les autres membres.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Règle d'accès</Text>
        <Text style={styles.panelText}>
          Aucun spectateur permanent. Chaque membre doit prendre l'initiative d'organiser une sortie avant de rejoindre
          celles de la communauté.
        </Text>
      </View>

      <View style={styles.panel}>
        {principles.map((principle, index) => (
          <View key={principle} style={styles.principle}>
            <Text style={styles.principleNumber}>{index + 1}</Text>
            <Text style={styles.principleText}>{principle}</Text>
          </View>
        ))}
      </View>

      <Link href="/dashboard" asChild>
        <NativeButton onPress={() => {}}>Proposer un événement</NativeButton>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 20,
    padding: 18,
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
  },
  subtitle: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  panelTitle: {
    color: "#0f172a",
    fontSize: 19,
    fontWeight: "900",
  },
  panelText: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  principle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  principleNumber: {
    backgroundColor: "#f0fdfa",
    borderRadius: 10,
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  principleText: {
    color: "#334155",
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
});
