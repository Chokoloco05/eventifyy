import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type NativeButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
};

export default function NativeButton({
  children,
  disabled = false,
  onPress,
  variant = "primary",
}: NativeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.text, variant === "ghost" && styles.ghostText]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primary: {
    backgroundColor: "#0f766e",
  },
  secondary: {
    backgroundColor: "#334155",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  ghostText: {
    color: "#0f766e",
  },
});
