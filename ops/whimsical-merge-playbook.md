# Merge “whimsical-wandering-data-6bf04dae” into `JW-Flo/AWhittleWandering`

This repo (`JW-Flo/AWhittleWandering`) is intended to become the long-term “management/dev” home.
The goal is to **preserve all work and history** from the whimsical repo while consolidating ongoing development here.

## Preconditions

- You have **read access** to the source repo (example): `JW-Flo/whimsical-wandering-data-6bf04dae`
- You can clone/fetch it over HTTPS or SSH.
- Your working tree in `AWhittleWandering` is clean.

## Recommended approach (preserve history, avoid conflicts): git subtree import

This imports the entire whimsical repo into a subdirectory (default: `legacy/whimsical/`) while keeping *all* commits.
It avoids “root-level file collisions” between the two codebases.

### One-time import commands

From the `AWhittleWandering` repo root:

```bash
# Ensure clean working tree
git status --porcelain=v1

# Add the whimsical remote (replace URL)
git remote add whimsical <WHIMSICAL_REPO_URL>
git fetch whimsical --tags

# Discover default branch name on the remote (often main/master)
git remote show whimsical

# Import (choose the correct branch, e.g. main)
git subtree add --prefix=legacy/whimsical whimsical <WHIMSICAL_DEFAULT_BRANCH> -m "Import whimsical repo as legacy subtree (preserve history)"
```

### Why subtree (not squash)

- `git subtree add` **without** `--squash` keeps the full upstream history.
- A “plain merge” (`--allow-unrelated-histories`) at repo root often causes many conflicts and a messy layout.

## Alternative approach (only if you want ONE unified root)

This merges histories at repo root. Use only if you *intend* to reconcile and unify file layout.

```bash
git remote add whimsical <WHIMSICAL_REPO_URL>
git fetch whimsical --tags
git merge --allow-unrelated-histories whimsical/<WHIMSICAL_DEFAULT_BRANCH>
```

Expect conflicts if both repos have similar top-level files (e.g. `README.md`, `package.json`, `backend/`, `frontend/`, etc.).

## GitHub “management/dev takeover” checklist

After importing:

- **Set `JW-Flo/AWhittleWandering` as canonical**:
  - Update the whimsical repo `README` to point to `AWhittleWandering`.
  - Archive the whimsical repo, or restrict it to read-only (preferred).
- **Move Issues/PRs (optional)**:
  - GitHub does not automatically move Issues across repos; use export/import or keep them and cross-link.
- **Secrets and CI**:
  - Do *not* copy `.env` or credentials from whimsical.
  - Prefer GitHub Actions secrets / Cloudflare/Wrangler secrets for any deployments.

## Verification

After import, verify:

```bash
git log --oneline -- legacy/whimsical | head
git ls-tree -r HEAD --name-only legacy/whimsical | head
```

And run the normal repo checks for this project (adjust if your package manager differs):

```bash
bun -v
bun install
bun run lint
bun test
```

