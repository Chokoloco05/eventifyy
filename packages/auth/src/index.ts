import { createPrismaClient } from "@eventifyy/db";
import { env } from "@eventifyy/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

const configuredOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

const developmentOrigins =
  env.NODE_ENV === "development"
    ? [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://10.0.2.2:8081",
      ]
    : [];

export function createAuth() {
  const prisma = createPrismaClient();

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    trustedOrigins: [...new Set([...configuredOrigins, ...developmentOrigins])],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [nextCookies()],
  });
}

export const auth = createAuth();
