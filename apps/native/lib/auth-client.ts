import { env } from "@eventifyy/env/native";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.EXPO_PUBLIC_SERVER_URL,
});
