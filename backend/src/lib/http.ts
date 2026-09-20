import type { Context } from "hono";

export class ApiError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409 | 422 | 500 | 502,
    message: string,
    public code = "request_failed",
  ) {
    super(message);
  }
}

export function jsonError(c: Context, error: unknown) {
  if (error instanceof ApiError) {
    return c.json(
      { error: { code: error.code, message: error.message } },
      error.status,
    );
  }
  console.error("Unhandled request error", error);
  return c.json(
    { error: { code: "internal_error", message: "Something went wrong." } },
    500,
  );
}

export function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
