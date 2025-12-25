import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

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
    if (lk.includes("token") || lk.includes("secret") || lk.includes("value")) delete clean[k];
  }
  const suffix = Object.keys(clean).length ? ` ${JSON.stringify(clean)}` : "";
  process.stdout.write(`${msg}${suffix}\n`);
}

function base64url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function generateRandomToken() {
  // 48 bytes => 64-ish chars base64url, strong enough for bearer/JWT HMAC secrets
  return base64url(crypto.randomBytes(48));
}

function getItemByTitle(vault, title) {
  return runJson("op", ["item", "get", title, "--vault", vault, "--format", "json"]);
}

function upsertItemField(vault, title, fieldLabel, value) {
  // Ensure item exists
  try {
    run("op", ["item", "get", title, "--vault", vault], { stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    run("op", ["item", "create", "--vault", vault, "--category", "Secure Note", "--title", title], { stdio: ["ignore", "pipe", "pipe"] });
  }
  run("op", ["item", "edit", title, "--vault", vault, `${fieldLabel}=${value}`], { stdio: ["ignore", "pipe", "pipe"] });
}

function deleteItemIfExists(vault, title) {
  try {
    const item = getItemByTitle(vault, title);
    const id = String(item?.id || "");
    if (!id) return false;
    run("op", ["item", "delete", id, "--vault", vault], { stdio: ["ignore", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
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
      (/^(value|token|secret|api[_ ]?key|key|password)$/i.test(label) ? 10 : 0);
    candidates.push({ s, rank });
  }
  if (!candidates.length) return "";
  candidates.sort((a, b) => b.rank - a.rank);
  return candidates[0].s;
}

function rotateOne(vault, name) {
  const prevName = `${name}_PREVIOUS`;
  let current = "";
  try {
    const item = getItemByTitle(vault, name);
    current = extractBestItemValue(item);
  } catch {
    current = "";
  }

  const next = generateRandomToken();

  // Only write *_PREVIOUS if we had a current value.
  if (current) {
    upsertItemField(vault, prevName, prevName, current);
    safeLog("rotate.previous.set", { name: prevName });
  } else {
    safeLog("rotate.previous.skip.empty", { name: prevName });
  }

  upsertItemField(vault, name, name, next);
  safeLog("rotate.current.set", { name });
}

function main() {
  const vault = "AWW_SHARED";
  const rotate = String(process.env.ROTATE || "both");
  const action = String(process.env.ACTION || "rotate");

  const targets = [];
  if (rotate === "admin" || rotate === "both") targets.push("ADMIN_TOKEN");
  if (rotate === "jwt" || rotate === "both") targets.push("JWT_SECRET");

  safeLog("rotate.start", { vault, rotate, action });

  if (action === "clear_previous") {
    for (const t of targets) {
      const prev = `${t}_PREVIOUS`;
      const deleted = deleteItemIfExists(vault, prev);
      safeLog(deleted ? "rotate.previous.cleared" : "rotate.previous.missing", { name: prev });
    }
    safeLog("rotate.done", { action, targets });
    return;
  }

  if (action !== "rotate") throw new Error(`Unknown ACTION=${action}`);

  for (const t of targets) rotateOne(vault, t);

  safeLog("rotate.done", { action, targets });
}

try {
  main();
} catch (e) {
  safeLog("rotate.error", { message: String(e?.message || e) });
  process.exit(1);
}









