import { createContext } from "@eventifyy/api/context";
import { appRouter } from "@eventifyy/api/routers/index";
import { env } from "@eventifyy/env/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

function isDevelopmentOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const isDevPort = ["3001", "8081"].includes(url.port);
    const isLocalHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
    const isPrivateNetwork =
      url.hostname.startsWith("192.168.") ||
      url.hostname.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(url.hostname);

    return env.NODE_ENV === "development" && isDevPort && (isLocalHost || isPrivateNetwork);
  } catch {
    return false;
  }
}

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = new Headers({
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type, authorization, trpc-accept",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  });

  if (origin && (allowedOrigins.includes(origin) || isDevelopmentOrigin(origin))) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

async function handler(req: NextRequest) {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
  });

  getCorsHeaders(req).forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

function options(req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export { handler as GET, handler as POST };
export { options as OPTIONS };
