# PR Triage Rules

## Purpose

Prevent PR/branch sprawl that blocks deployment. These rules apply to all contributors—human and agent.

## Rules

### 1. One Active PR at a Time for Platform Wiring

Only one PR may be open for infrastructure/platform changes (DNS, wrangler config, CI pipelines, Pages settings). If a platform PR already exists, append commits to it rather than opening a new one.

### 2. Agents May Not Spawn New PRs

AI agents (Copilot, Codex, Claude, Cursor) must commit to the **current active branch** assigned to them. If the task requires work outside the current PR scope, the agent must:

- Open or append to a **GitHub Issue** describing the needed work
- Reference the issue number in a commit message comment
- **Not** create a new branch or PR

### 3. Issues Over PRs for Blockers

If you encounter a blocker that cannot be resolved in the current PR:

1. Open a GitHub Issue with the label `blocker`
2. Include: what failed, what you tried, what the next action should be
3. Continue working on the current PR for items that are not blocked

### 4. Branch Naming

- Feature branches: `feature/<short-description>`
- Agent branches: `claude/<task>-<id>` or `copilot/<task>`
- No nested branches (e.g., `feature/fix/thing` is not allowed)

### 5. PR Size Limits

- PRs should touch fewer than 30 files when possible
- If a PR exceeds 50 files, it must be split or receive explicit human approval

### 6. Merge Hygiene

- Squash merge is the default for feature PRs
- Rebase merge for documentation-only PRs
- Delete the branch after merge
