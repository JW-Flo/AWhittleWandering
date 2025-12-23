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

function setGithubRepoSecret(repo, name, value) {
  // Avoid echoing the value; pass via process env.
  run("gh", ["secret", "set", name, "--repo", repo, "--body", value], { stdio: ["ignore", "pipe", "pipe"] });
}

function triggerWorkflow(repo, workflowFile, target) {
  // Avoid `gh workflow run` because it may query defaultBranchRef via GraphQL, which can be blocked for integrations.
  // Dispatch via REST with an explicit ref.
  const [owner, name] = String(repo).split("/", 2);
  const ref = process.env.GITHUB_WORKFLOW_REF || "main";
  run(
    "gh",
    [
      "api",
      "--method",
      "POST",
      `repos/${owner}/${name}/actions/workflows/${workflowFile}/dispatches`,
      "-f",
      `ref=${ref}`,
      "-f",
      `inputs[target]=${target}`,
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
}

function main() {
  const cfg = getConfig();
  const repo = getRepo();

  const vault = cfg.onePassword.vault;
  const denySet = new Set(cfg.onePassword.denyFieldLabels || []);
  const labelRe = new RegExp(cfg.onePassword.fieldLabelRegex || "^[A-Z][A-Z0-9_]+$");

  const targets = ["development", "production"];
  const results = [];

  safeLog("sync.start", { repo, vault });

  for (const target of targets) {
    const itemTitle = cfg.onePassword.items?.[target];
    if (!itemTitle) {
      safeLog("sync.skip.missing_config", { target });
      continue;
    }

    const item = getItem(vault, itemTitle);
    const opUpdatedAt = String(item.updated_at || item.updatedAt || "");
    if (!opUpdatedAt) throw new Error(`Missing updated_at for op://${vault}/${itemTitle}/*`);

    safeLog("sync.apply.start", { target, scope: "repo", item: `${vault}/${itemTitle}`, opUpdatedAt });

    const fields = Array.isArray(item.fields) ? item.fields : [];
    let written = 0;
    for (const f of fields) {
      const label = String(f.label || "");
      if (!isAllowedLabel(label, labelRe, denySet)) continue;

      const value = f.value;
      if (value === null || value === undefined) continue;
      const s = String(value);
      if (!s.trim()) continue;

      setGithubRepoSecret(repo, label, s);
      written += 1;
      safeLog("sync.secret.set", { target, name: label });
    }
    safeLog("sync.apply.done", { target, written, opUpdatedAt });

    if (cfg.behavior?.triggerCloudflareWorkflow) {
      const wf = cfg.behavior.cloudflareWorkflowFile || "sync-secrets.yml";
      triggerWorkflow(repo, wf, target);
      safeLog("sync.cloudflare.dispatched", { target, workflow: wf });
    }

    results.push({ target, written, opUpdatedAt });
  }

  safeLog("sync.done", { results });
}

try {
  main();
} catch (err) {
  safeLog("sync.error", { message: err?.message || String(err) });
  process.exit(1);
}



