import type { Context } from "hono";
import type { ZodType } from "zod";
import { ApiError } from "./http";

export async function parseJson<T>(c: Context, schema: ZodType<T>): Promise<T> {
  const payload = await c.req.json().catch(() => undefined);
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ApiError(
      422,
      result.error.issues[0]?.message ?? "Invalid request.",
      "invalid_input",
    );
  }
  return result.data;
}

export function publicProfile(row: Record<string, unknown>) {
  return {
    id: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_key ? `/v1/media/${row.avatar_key}` : null,
    privacyMode: row.privacy_mode,
  };
}
