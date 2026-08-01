import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { authClient } from "@/lib/auth-client";
import NativeButton from "@/components/native-button";
import Screen from "@/components/screen";
import TextField from "@/components/text-field";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = mode === "sign-in" ? "Welcome Back" : "Create Account";
  const switchLabel = mode === "sign-in" ? "Need an account? Sign Up" : "Already have an account? Sign In";

  async function handleSubmit() {
    if (!email || !password || (mode === "sign-up" && !name)) {
      Alert.alert("Formulaire incomplet", "Renseigne tous les champs requis.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Mot de passe invalide", "Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }

    setIsSubmitting(true);

    if (mode === "sign-in") {
      await authClient.signIn.email(
        { email, password },
        {
          onSuccess: () => router.replace("/dashboard"),
          onError: ({ error }) => Alert.alert("Connexion impossible", error.message || error.statusText),
        },
      );
    } else {
      await authClient.signUp.email(
        { email, name, password },
        {
          onSuccess: () => router.replace("/dashboard"),
          onError: ({ error }) => Alert.alert("Inscription impossible", error.message || error.statusText),
        },
      );
    }

    setIsSubmitting(false);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Meme parcours auth que la version web.</Text>
      </View>

      <View style={styles.form}>
        {mode === "sign-up" ? (
          <TextField
            autoCapitalize="words"
            label="Name"
            onChangeText={setName}
            placeholder="Jane Doe"
            value={name}
          />
        ) : null}

        <TextField
          label="Email"
          onChangeText={setEmail}
          placeholder="jane@example.com"
          value={email}
        />

        <TextField
          label="Password"
          onChangeText={setPassword}
          placeholder="Minimum 8 caracteres"
          secureTextEntry
          value={password}
        />

        <NativeButton disabled={isSubmitting} onPress={handleSubmit}>
          {isSubmitting ? "Submitting..." : mode === "sign-in" ? "Sign In" : "Sign Up"}
        </NativeButton>

        <NativeButton
          onPress={() => setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"))}
          variant="ghost"
        >
          {switchLabel}
        </NativeButton>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    paddingTop: 32,
  },
  title: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    textAlign: "center",
  },
  form: {
    gap: 16,
    marginTop: 20,
  },
});
