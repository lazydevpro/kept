import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { authSchema } from "./db/auth-schema";
import type { AppEnv } from "./types";

export function createAuth(env: AppEnv, requestUrl: string) {
  const origin = new URL(requestUrl).origin;
  const socialProviders = {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
      ? {
          apple: {
            clientId: env.APPLE_CLIENT_ID,
            clientSecret: env.APPLE_CLIENT_SECRET,
          },
        }
      : {}),
  };

  return betterAuth({
    appName: "KEPT",
    baseURL: origin,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(drizzle(env.DB, { schema: authSchema }), {
      provider: "sqlite",
      schema: authSchema,
    }),
    socialProviders,
    trustedOrigins: [
      env.APP_ORIGIN,
      "neonreserve://",
      "exp://",
      // Local-only: lets the Expo web export sign in against `wrangler dev`.
      ...(String(env.ENVIRONMENT) === "local"
        ? ["http://localhost:8082", "http://127.0.0.1:8082"]
        : []),
    ],
    plugins: [anonymous(), expo()],
    advanced: { useSecureCookies: String(env.ENVIRONMENT) === "production" },
  });
}
