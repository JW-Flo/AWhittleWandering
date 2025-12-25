import type { Env } from "../types/env";

export function getTessieBearerToken(env: Env): string | undefined {
  const token = env?.TESSIE_API_TOKEN || env?.TESSIE_API_KEY;
  const s = typeof token === "string" ? token.trim() : "";
  return s ? s : undefined;
}










