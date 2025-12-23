import { execFileSync } from "node:child_process";

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}

function runJson(cmd, args) {
  const out = run(cmd, args);
  return JSON.parse(out || "null");
}

function safeLog(msg, meta = {}) {
  const clean = { ...meta };
  for (const k of Object.keys(clean)) {
    const lk = k.toLowerCase();
    if (lk.includes("token") || lk.includes("secret") || lk.includes("value") || lk.includes("authorization")) delete clean[k];
  }
  const suffix = Object.keys(clean).length ? ` ${JSON.stringify(clean)}` : "";
  process.stdout.write(`${msg}${suffix}\n`);
}

function summarizeCfErrorBody(body) {
  try {
    if (!body) return undefined;
    if (typeof body === "string") return body.slice(0, 300);
    const errs = Array.isArray(body?.errors) ? body.errors : [];
    if (errs.length) {
      const e0 = errs[0] || {};
      return { code: e0.code, message: e0.message };
    }
    const msgs = Array.isArray(body?.messages) ? body.messages : [];
    if (msgs.length) {
      const m0 = msgs[0] || {};
      return { code: m0.code, message: m0.message };
    }
    return JSON.stringify(body).slice(0, 300);
  } catch {
    return undefined;
  }
}

function extractBestItemValue(item) {
  const fields = Array.isArray(item?.fields) ? item.fields : [];
  const candidates = [];
  for (const f of fields) {
    const v = f?.value;
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (!s) continue;
    const label = String(f?.label || "");
    const id = String(f?.id || "");
    const type = String(f?.type || "");
    const purpose = String(f?.purpose || "");
    const rank =
      (id === "password" ? 100 : 0) +
      (purpose.toUpperCase() === "PASSWORD" ? 50 : 0) +
      (type.toUpperCase() === "CONCEALED" ? 25 : 0) +
      (/^(value|token|secret|api[_ ]?key|key|password|id)$/i.test(label) ? 10 : 0);
    candidates.push({ s, rank });
  }
  if (!candidates.length) return "";
  candidates.sort((a, b) => b.rank - a.rank);
  return candidates[0].s;
}

function tryGetItemJson(vault, title) {
  try {
    return runJson("op", ["item", "get", title, "--vault", vault, "--format", "json"]);
  } catch {
    return null;
  }
}

function getItemValue(vault, title) {
  // Support BOTH patterns:
  // - items named exactly like the secret (e.g. "CLOUDFLARE_API_TOKEN")
  // - a shared "automation" item with fields labeled like the secret (e.g. "CLOUDFLARE_TOKEN_MANAGER")
  const direct = tryGetItemJson(vault, title);
  if (direct) return String(extractBestItemValue(direct) || "").trim();

  const automation = tryGetItemJson(vault, "automation");
  if (automation) {
    const fields = Array.isArray(automation?.fields) ? automation.fields : [];
    const hit = fields.find((f) => String(f?.label || "") === title);
    const v = String(hit?.value ?? "").trim();
    if (v) return v;
  }
  return "";
}

function upsertItemField(vault, title, fieldLabel, value) {
  try {
    run("op", ["item", "get", title, "--vault", vault], { stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    run("op", ["item", "create", "--vault", vault, "--category", "Secure Note", "--title", title], {
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  run("op", ["item", "edit", title, "--vault", vault, `${fieldLabel}=${value}`], { stdio: ["ignore", "pipe", "pipe"] });
}

function deleteItemIfExists(vault, title) {
  try {
    const item = runJson("op", ["item", "get", title, "--vault", vault, "--format", "json"]);
    const id = String(item?.id || "");
    if (!id) return false;
    run("op", ["item", "delete", id, "--vault", vault], { stdio: ["ignore", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

async function cfRequestJson(url, { method, token }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text || "null");
    } catch {
      json = null;
    }
    if (!res.ok) {
      const msg = `Cloudflare API HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.body = json || text;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

async function tryListTokens({ accountId, managerToken }) {
  // Cloudflare has multiple token surfaces (user vs account-owned). We try both.
  const endpoints = [
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/tokens`,
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/api/tokens`,
    `https://api.cloudflare.com/client/v4/user/tokens`,
  ];

  for (const url of endpoints) {
    try {
      const json = await cfRequestJson(url, { method: "GET", token: managerToken });
      const result = json?.result;
      if (Array.isArray(result)) return result;
      // Sometimes the API wraps arrays differently; be tolerant.
      if (Array.isArray(result?.tokens)) return result.tokens;
    } catch (e) {
      safeLog("cf.tokens.list.failed", { url, status: e?.status, error: summarizeCfErrorBody(e?.body) });
    }
  }
  return [];
}

async function verifyTokenId({ deployToken }) {
  const token = String(deployToken || "").trim();
  if (!token) return "";
  // Cloudflare API Token verify endpoint (returns metadata including identifier/id).
  const url = "https://api.cloudflare.com/client/v4/user/tokens/verify";
  const json = await cfRequestJson(url, { method: "GET", token });
  const rawId = String(json?.result?.id || "").trim();
  const rawIdentifier = String(json?.result?.identifier || "").trim();
  // Prefer "identifier" if present; Cloudflare APIs often use it as the stable id.
  const chosen = rawIdentifier || rawId;
  safeLog("cf.token.verify", {
    hasId: Boolean(rawId),
    hasIdentifier: Boolean(rawIdentifier),
    idLen: rawId ? rawId.length : 0,
    identifierLen: rawIdentifier ? rawIdentifier.length : 0,
  });
  return chosen;
}

async function resolveTokenId({ accountId, managerToken, tokenId, tokenName }) {
  const existing = String(tokenId || "").trim();
  if (existing) {
    safeLog("cf.token_id.resolved.explicit", { idLen: existing.length });
    return existing;
  }

  const name = String(tokenName || "").trim();
  if (!name) {
    throw new Error(
      "Missing CLOUDFLARE_API_TOKEN_ID (preferred) or CLOUDFLARE_API_TOKEN_NAME (fallback; exact name of the deploy token as shown in Cloudflare UI)"
    );
  }

  const tokens = await tryListTokens({ accountId, managerToken });
  if (!tokens.length) throw new Error("Unable to list Cloudflare tokens to resolve CLOUDFLARE_API_TOKEN_ID");

  // Find by exact name first, then case-insensitive.
  const exact = tokens.filter((t) => String(t?.name || "") === name);
  const ci = tokens.filter((t) => String(t?.name || "").toLowerCase() === name.toLowerCase());
  const matches = exact.length ? exact : ci;

  if (matches.length !== 1) {
    const available = tokens
      .map((t) => String(t?.name || ""))
      .filter(Boolean)
      .slice(0, 30);
    throw new Error(
      `Could not uniquely resolve deploy token id by name "${name}" (matches=${matches.length}). Available token names (first 30): ${available.join(
        ", "
      )}`
    );
  }

  const rawId = String(matches[0]?.id || "").trim();
  const rawIdentifier = String(matches[0]?.identifier || "").trim();
  const chosen = rawIdentifier || rawId;
  safeLog("cf.token_id.resolved.by_name", {
    tokenName: name,
    hasId: Boolean(rawId),
    hasIdentifier: Boolean(rawIdentifier),
    idLen: rawId ? rawId.length : 0,
    identifierLen: rawIdentifier ? rawIdentifier.length : 0,
    chosenLen: chosen ? chosen.length : 0,
  });
  if (!chosen) throw new Error("Cloudflare token list response did not include an id/identifier for the matched token");
  return chosen;
}

async function rollCloudflareToken({ accountId, tokenId, managerToken }) {
  const id = encodeURIComponent(tokenId);
  const acct = encodeURIComponent(accountId);
  const urls = [
    // Account-owned token routes (preferred)
    `https://api.cloudflare.com/client/v4/accounts/${acct}/tokens/${id}/roll`,
    `https://api.cloudflare.com/client/v4/accounts/${acct}/tokens/${id}/rotate`,
    `https://api.cloudflare.com/client/v4/accounts/${acct}/api/tokens/${id}/roll`,
    // User token routes (fallback)
    `https://api.cloudflare.com/client/v4/user/tokens/${id}/roll`,
    `https://api.cloudflare.com/client/v4/user/tokens/${id}/rotate`,
  ];
  const methods = ["PUT", "POST"];

  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let lastErr = null;
      for (const method of methods) {
        for (const url of urls) {
          try {
            const json = await cfRequestJson(url, { method, token: managerToken });
            if (!json || json.success !== true) {
              throw new Error(`Cloudflare roll failed: ${JSON.stringify({ success: json?.success, errors: json?.errors })}`);
            }
            const value =
              json?.result?.value ||
              json?.result?.token ||
              json?.result?.api_token ||
              json?.result?.apiToken ||
              json?.result ||
              "";
            const s = String(value || "").trim();
            if (!s || s.startsWith("op://") || s.includes("\n") || s.includes("\r")) {
              throw new Error("Cloudflare roll returned an unexpected token value shape");
            }
            safeLog("cf.roll.ok", { method, url });
            return s;
          } catch (e) {
            lastErr = e;
            safeLog("cf.roll.endpoint.failed", { method, url, status: e?.status, error: summarizeCfErrorBody(e?.body) });
          }
        }
      }
      throw lastErr || new Error("Cloudflare roll failed on all known endpoints");
    } catch (e) {
      const msg = String(e?.message || e);
      const isRetryable = /HTTP\s+5\d\d/.test(msg) || /timeout|aborted|ECONNRESET|EAI_AGAIN/i.test(msg);
      const last = attempt === maxAttempts;
      safeLog("cf.roll.error", { attempt, last, isRetryable });
      if (!isRetryable || last) throw e;
      const backoffMs = Math.round(300 * Math.pow(2, attempt - 1) + Math.random() * 300);
      sleepMs(backoffMs);
    }
  }
  throw new Error("Unreachable");
}

async function main() {
  const vault = "AWW_SHARED";
  const action = String(process.env.ACTION || "rotate");

  safeLog("cf.rotate.start", { vault, action });

  if (action === "clear_previous") {
    const deleted = deleteItemIfExists(vault, "CLOUDFLARE_API_TOKEN_PREVIOUS");
    safeLog(deleted ? "cf.rotate.previous.cleared" : "cf.rotate.previous.missing", { name: "CLOUDFLARE_API_TOKEN_PREVIOUS" });
    safeLog("cf.rotate.done", { action });
    return;
  }

  if (action !== "rotate") throw new Error(`Unknown ACTION=${action}`);

  const managerToken = getItemValue(vault, "CLOUDFLARE_TOKEN_MANAGER");
  const accountId = getItemValue(vault, "CLOUDFLARE_ACCOUNT_ID");
  const tokenIdRaw = getItemValue(vault, "CLOUDFLARE_API_TOKEN_ID");
  const tokenName = getItemValue(vault, "CLOUDFLARE_API_TOKEN_NAME");

  if (!managerToken) {
    throw new Error(
      "Missing CLOUDFLARE_TOKEN_MANAGER in 1Password (either an item titled CLOUDFLARE_TOKEN_MANAGER, or a field on op://AWW_SHARED/automation)"
    );
  }
  if (!accountId) {
    throw new Error(
      "Missing CLOUDFLARE_ACCOUNT_ID in 1Password (either an item titled CLOUDFLARE_ACCOUNT_ID, or a field on op://AWW_SHARED/automation)"
    );
  }
  // Resolve deploy token id (preferred: explicit id; fallback: name via token list; fallback2: verify current deploy token).
  const current = getItemValue(vault, "CLOUDFLARE_API_TOKEN");
  let tokenId = "";
  try {
    tokenId = await resolveTokenId({ accountId, managerToken, tokenId: tokenIdRaw, tokenName });
  } catch (e) {
    safeLog("cf.token_id.resolve.failed", { message: String(e?.message || e) });
    const verifiedId = await verifyTokenId({ deployToken: current });
    if (!verifiedId) throw e;
    tokenId = verifiedId;
    safeLog("cf.token_id.resolved.via_verify", {});
  }

  // Preserve current deploy token as *_PREVIOUS (for recovery/debug). This is NOT used by wrangler.
  if (current) {
    upsertItemField(vault, "CLOUDFLARE_API_TOKEN_PREVIOUS", "CLOUDFLARE_API_TOKEN_PREVIOUS", current);
    safeLog("cf.rotate.previous.set", { name: "CLOUDFLARE_API_TOKEN_PREVIOUS" });
  } else {
    safeLog("cf.rotate.previous.skip.empty", { name: "CLOUDFLARE_API_TOKEN_PREVIOUS" });
  }

  const next = await rollCloudflareToken({ accountId, tokenId, managerToken });
  upsertItemField(vault, "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_API_TOKEN", next);
  safeLog("cf.rotate.current.set", { name: "CLOUDFLARE_API_TOKEN" });

  safeLog("cf.rotate.done", { action });
}

main().catch((e) => {
  safeLog("cf.rotate.error", { message: String(e?.message || e) });
  process.exit(1);
});


