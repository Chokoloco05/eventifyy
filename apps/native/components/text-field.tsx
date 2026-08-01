import { StyleSheet, Text, TextInput, View } from "react-native";

type TextFieldProps = {
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  value: string;
};

export default function TextField({
  autoCapitalize = "none",
  label,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  value,
}: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
