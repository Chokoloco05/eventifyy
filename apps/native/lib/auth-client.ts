import { createAuthClient } from "better-auth/react";

import { getServerUrl } from "@/utils/server-url";

export const authClient = createAuthClient({
  baseURL: getServerUrl(),
});
