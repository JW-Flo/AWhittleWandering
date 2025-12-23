import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}

function runJson(cmd, args) {
  const out = run(cmd, args);
  return JSON.parse(out || "null");
}

function getConfig() {
  const raw = readFileSync(new URL("./github-sync-config.json", import.meta.url), "utf8");
  return JSON.parse(raw);
}

function isAllowedLabel(label, re, denySet) {
  if (!label) return false;
  if (denySet.has(label)) return false;
  return re.test(label);
}

function safeLog(msg, meta = {}) {
  // Never log values.
  const clean = { ...meta };
  for (const k of Object.keys(clean)) {
    if (k.toLowerCase().includes("value") || k.toLowerCase().includes("token") || k.toLowerCase().includes("secret")) {
      delete clean[k];
    }
  }
  const suffix = Object.keys(clean).length ? ` ${JSON.stringify(clean)}` : "";
  process.stdout.write(`${msg}${suffix}\n`);
}

function getRepo() {
  const envRepo = process.env.GITHUB_REPO;
  if (envRepo) return envRepo;
  return run("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]);
}

function getItem(vault, title) {
  return runJson("op", ["item", "get", title, "--vault", vault, "--format", "json"]);
}

function getGithubEnvVar(repo, envName, varName) {
  const vars = runJson("gh", ["variable", "list", "--env", envName, "--repo", repo, "--json", "name,value"]);
  const found = (vars || []).find((v) => v.name === varName);
  return found?.value || "";
}

function setGithubEnvVar(repo, envName, varName, value) {
  // value is an ISO timestamp, not a secret.
  run("gh", ["variable", "set", varName, "--env", envName, "--repo", repo, "--body", value], { stdio: ["ignore", "pipe", "pipe"] });
}

function setGithubEnvSecret(repo, envName, name, value) {
  // Avoid echoing the value; pass via process env.
  run("gh", ["secret", "set", name, "--env", envName, "--repo", repo, "--body", value], { stdio: ["ignore", "pipe", "pipe"] });
}

function triggerWorkflow(repo, workflowFile, target) {
  run("gh", ["workflow", "run", workflowFile, "-f", `target=${target}`, "--repo", repo], { stdio: ["ignore", "pipe", "pipe"] });
}

function main() {
  const cfg = getConfig();
  const repo = getRepo();

  const vault = cfg.onePassword.vault;
  const denySet = new Set(cfg.onePassword.denyFieldLabels || []);
  const labelRe = new RegExp(cfg.onePassword.fieldLabelRegex || "^[A-Z][A-Z0-9_]+$");
  const lastSyncVar = cfg.github.lastSyncVarName || "AWW_1P_LAST_SYNCED_ITEM_UPDATED_AT";

  const targets = ["development", "production"];
  const results = [];

  safeLog("sync.start", { repo, vault });

  for (const target of targets) {
    const itemTitle = cfg.onePassword.items?.[target];
    const ghEnv = cfg.github.environments?.[target];
    if (!itemTitle || !ghEnv) {
      safeLog("sync.skip.missing_config", { target });
      continue;
    }

    const item = getItem(vault, itemTitle);
    const opUpdatedAt = String(item.updated_at || item.updatedAt || "");
    if (!opUpdatedAt) throw new Error(`Missing updated_at for op://${vault}/${itemTitle}/*`);

    const prev = getGithubEnvVar(repo, ghEnv, lastSyncVar);
    if (prev && prev >= opUpdatedAt) {
      safeLog("sync.noop", { target, opUpdatedAt, lastSynced: prev });
      results.push({ target, changed: false, opUpdatedAt });
      continue;
    }

    safeLog("sync.apply.start", { target, ghEnv, item: `${vault}/${itemTitle}`, opUpdatedAt });

    const fields = Array.isArray(item.fields) ? item.fields : [];
    let written = 0;
    for (const f of fields) {
      const label = String(f.label || "");
      if (!isAllowedLabel(label, labelRe, denySet)) continue;

      const value = f.value;
      if (value === null || value === undefined) continue;
      const s = String(value);
      if (!s.trim()) continue;

      setGithubEnvSecret(repo, ghEnv, label, s);
      written += 1;
      safeLog("sync.secret.set", { target, name: label });
    }

    setGithubEnvVar(repo, ghEnv, lastSyncVar, opUpdatedAt);
    safeLog("sync.apply.done", { target, written, opUpdatedAt });

    if (cfg.behavior?.triggerCloudflareWorkflow) {
      const wf = cfg.behavior.cloudflareWorkflowFile || "sync-secrets.yml";
      triggerWorkflow(repo, wf, target);
      safeLog("sync.cloudflare.dispatched", { target, workflow: wf });
    }

    results.push({ target, changed: true, written, opUpdatedAt });
  }

  safeLog("sync.done", { results });
}

try {
  main();
} catch (err) {
  safeLog("sync.error", { message: err?.message || String(err) });
  process.exit(1);
}



