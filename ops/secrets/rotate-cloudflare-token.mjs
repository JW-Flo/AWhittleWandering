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

function getItemValue(vault, title) {
  const item = runJson("op", ["item", "get", title, "--vault", vault, "--format", "json"]);
  const v = extractBestItemValue(item);
  return String(v || "").trim();
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

async function rollCloudflareToken({ accountId, tokenId, managerToken }) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/api/tokens/${encodeURIComponent(tokenId)}/roll`;

  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const json = await cfRequestJson(url, { method: "PUT", token: managerToken });
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
      return s;
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
  const tokenId = getItemValue(vault, "CLOUDFLARE_API_TOKEN_ID");

  if (!managerToken) throw new Error("Missing op://AWW_SHARED/CLOUDFLARE_TOKEN_MANAGER");
  if (!accountId) throw new Error("Missing op://AWW_SHARED/CLOUDFLARE_ACCOUNT_ID");
  if (!tokenId) throw new Error("Missing op://AWW_SHARED/CLOUDFLARE_API_TOKEN_ID (the identifier of the deploy token to roll)");

  // Preserve current deploy token as *_PREVIOUS (for recovery/debug). This is NOT used by wrangler.
  const current = getItemValue(vault, "CLOUDFLARE_API_TOKEN");
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


