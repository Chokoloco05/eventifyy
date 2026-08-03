import { env } from "@eventifyy/env/native";
import { Platform } from "react-native";

type WebLocation = {
  hostname: string;
  protocol: string;
};

export function getServerUrl() {
  const location = (globalThis as { location?: WebLocation }).location;

  if (Platform.OS === "web" && location) {
    const fallbackPort = new URL(env.EXPO_PUBLIC_SERVER_URL).port || "3001";
    return `${location.protocol}//${location.hostname}:${fallbackPort}`;
  }

  return env.EXPO_PUBLIC_SERVER_URL;
}
