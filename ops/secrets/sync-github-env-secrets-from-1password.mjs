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

function validateSecretValue(label, value) {
  const s = String(value ?? "").trim();
  if (!s) return { ok: false, reason: "empty" };
  // Common misconfiguration: storing a 1Password reference literal instead of the raw value.
  if (s.startsWith("op://")) return { ok: false, reason: "looks_like_op_reference" };
  // Reject embedded newlines for secrets we pass to CLIs (prevents header formatting issues).
  if (s.includes("\n") || s.includes("\r")) return { ok: false, reason: "contains_newlines" };
  return { ok: true, value: s };
}

function tryRun(cmd, args) {
  try {
    return { ok: true, out: run(cmd, args) };
  } catch (e) {
    return { ok: false, error: e };
  }
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

function listItems(vault) {
  // Returns [{id,title}, ...]
  return runJson("op", ["item", "list", "--vault", vault, "--format", "json"]);
}

function setGithubRepoSecret(repo, name, value) {
  // Avoid echoing the value; pass via process env.
  run("gh", ["secret", "set", name, "--repo", repo, "--body", value], { stdio: ["ignore", "pipe", "pipe"] });
}

function triggerWorkflow(repo, workflowFile, target) {
  // Avoid `gh workflow run` because it may query defaultBranchRef via GraphQL, which can be blocked for integrations.
  // Dispatch via REST with an explicit ref.
  const [owner, name] = String(repo).split("/", 2);
  // In Actions, use the branch name, not the workflow ref.
  const ref = process.env.GITHUB_REF_NAME || "main";
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

function main() {
  const cfg = getConfig();
  const repo = getRepo();

  const vault = cfg.onePassword.vault;
  const denySet = new Set(cfg.onePassword.denyFieldLabels || []);
  const allowSet = new Set(cfg.onePassword.allowedSecretNames || []);
  const labelRe = new RegExp(cfg.onePassword.fieldLabelRegex || "^[A-Z][A-Z0-9_]+$");

  const targets = ["development", "production"];
  const results = [];

  safeLog("sync.start", { repo, vault });

  const singleItemTitle = cfg.onePassword.item;
  // Source mode 1: single bundled item (fields become secret names), e.g. AWW_SHARED/prod
  // Source mode 2 (fallback): vault contains many items named like secret names (e.g. MAPBOX_API_TOKEN),
  // in which case the item title becomes the secret name and we extract the best field value.
  if (singleItemTitle) {
    const got = tryRun("op", ["item", "get", singleItemTitle, "--vault", vault, "--format", "json"]);
    if (got.ok) {
      const item = JSON.parse(got.out || "null");
      const opUpdatedAt = String(item?.updated_at || item?.updatedAt || "");
      safeLog("sync.apply.start", { source: "bundled_item", scope: "repo", item: `${vault}/${singleItemTitle}`, opUpdatedAt });

      const fields = Array.isArray(item?.fields) ? item.fields : [];
      let written = 0;
      for (const f of fields) {
        const label = String(f?.label || "");
        if (!isAllowedLabel(label, labelRe, denySet)) continue;

        const v = validateSecretValue(label, f?.value);
        if (!v.ok) {
          safeLog("sync.secret.skip.invalid_value", { source: "bundled_item", name: label, reason: v.reason });
          continue;
        }

        setGithubRepoSecret(repo, label, v.value);
        written += 1;
        safeLog("sync.secret.set", { source: "bundled_item", name: label });
      }

      safeLog("sync.apply.done", { source: "bundled_item", written, opUpdatedAt });
      results.push({ source: "bundled_item", written, opUpdatedAt });
    } else {
      safeLog("sync.source.bundled_item_missing", { item: `${vault}/${singleItemTitle}` });

      const items = Array.isArray(listItems(vault)) ? listItems(vault) : [];
      let written = 0;
      safeLog("sync.apply.start", { source: "per_item", scope: "repo", itemCount: items.length });
      for (const it of items) {
        const title = String(it?.title || "");
        // Enforce naming + denylist first.
        if (!isAllowedLabel(title, labelRe, denySet)) continue;
        // Never sync legacy CF_* items; only CLOUDFLARE_* is allowed.
        if (title.startsWith("CF_")) continue;
        // Strong allowlist guard: only sync the platform secrets we explicitly expect.
        if (allowSet.size && !allowSet.has(title)) continue;

        // Fetch the full item (so we can extract concealed fields).
        const item = getItem(vault, title);
        const raw = extractBestItemValue(item);
        const v = validateSecretValue(title, raw);
        if (!v.ok) {
          safeLog("sync.secret.skip.invalid_value", { source: "per_item", name: title, reason: v.reason });
          continue;
        }

        setGithubRepoSecret(repo, title, v.value);
        written += 1;
        safeLog("sync.secret.set", { source: "per_item", name: title });
      }
      safeLog("sync.apply.done", { source: "per_item", written });
      results.push({ source: "per_item", written });
    }
  } else {
    const sources = targets
      .map((target) => ({ source: target, itemTitle: cfg.onePassword.items?.[target] }))
      .filter((s) => s.itemTitle);

    for (const { source, itemTitle } of sources) {
      const item = getItem(vault, itemTitle);
      const opUpdatedAt = String(item.updated_at || item.updatedAt || "");
      if (!opUpdatedAt) throw new Error(`Missing updated_at for op://${vault}/${itemTitle}/*`);

      safeLog("sync.apply.start", { source, scope: "repo", item: `${vault}/${itemTitle}`, opUpdatedAt });

      const fields = Array.isArray(item.fields) ? item.fields : [];
      let written = 0;
      for (const f of fields) {
        const label = String(f.label || "");
        if (!isAllowedLabel(label, labelRe, denySet)) continue;

        const v = validateSecretValue(label, f.value);
        if (!v.ok) {
          safeLog("sync.secret.skip.invalid_value", { source, name: label, reason: v.reason });
          continue;
        }

        setGithubRepoSecret(repo, label, v.value);
        written += 1;
        safeLog("sync.secret.set", { source, name: label });
      }
      safeLog("sync.apply.done", { source, written, opUpdatedAt });
      results.push({ source, written, opUpdatedAt });
    }
  }

  if (cfg.behavior?.triggerCloudflareWorkflow) {
    const wf = cfg.behavior.cloudflareWorkflowFile || "sync-secrets.yml";
    const cfTargets = cfg.behavior.cloudflareTargets || targets;
    for (const t of cfTargets) {
      triggerWorkflow(repo, wf, t);
      safeLog("sync.cloudflare.dispatched", { target: t, workflow: wf });
    }
  }

  safeLog("sync.done", { results });
}

try {
  main();
} catch (err) {
  safeLog("sync.error", { message: err?.message || String(err) });
  process.exit(1);
}



