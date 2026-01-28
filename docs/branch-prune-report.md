# Remote branch prune report

Generated: 2026-01-28 (local time)

Remote branches (most-recent first):

```
2026-01-28 16:32:54 -0600 origin/main
2026-01-28 16:31:36 -0600 origin/cleanup/remove-supabase
2026-01-28 16:29:05 -0600 origin/cleanup/remove-supabase-hardcoded
2026-01-28 16:18:15 -0600 origin/cleanup/remove-legacy-whimsical
2026-01-06 11:43:51 -0600 origin/claude/awhittle-backend-api-GHN5B
2026-01-06 06:54:51 +0000 origin/copilot/sub-pr-69
2026-01-06 02:08:44 +0000 origin/claude/analyze-test-coverage-izNdh
2025-12-30 23:25:34 -0600 origin/tmp/publish-api-shield-sync
2025-12-25 04:52:03 +0000 origin/copilot/sub-pr-51-again
2025-12-25 04:51:41 +0000 origin/copilot/sub-pr-58-one-more-time
2025-12-25 04:48:44 +0000 origin/copilot/sub-pr-62-again
2025-12-25 04:46:55 +0000 origin/copilot/sub-pr-51
2025-12-25 04:46:54 +0000 origin/copilot/sub-pr-58-yet-again
2025-12-25 04:46:53 +0000 origin/copilot/sub-pr-62
2025-12-23 07:56:28 -0600 origin/fix/frontend-api-base-and-backend-cors
2025-12-23 13:44:48 +0000 origin/copilot/sub-pr-58-another-one
2025-12-23 13:44:34 +0000 origin/copilot/sub-pr-58
2025-12-23 13:44:17 +0000 origin/copilot/sub-pr-58-again
2025-12-23 07:41:39 -0600 origin/qa/live-domain-runner-and-endpoints
2025-12-22 21:43:41 -0600 origin/ci/codex-optional-security-scan
2025-12-22 21:06:36 -0600 origin/ci/codex-lite-full-gates
2025-12-22 20:13:41 -0600 origin/test/codex-trigger-simple-2
2025-12-22 20:09:22 -0600 origin/test/codex-trigger-simple
2025-12-22 20:01:07 -0600 origin/cursor/ci-fixes-secrets-secscan
2025-12-22 19:56:37 -0600 origin/temp/ci-fixes
2025-12-23 01:30:15 +0000 origin/copilot/sub-pr-46-again
2025-12-23 01:20:35 +0000 origin/copilot/sub-pr-46
2025-12-22 02:45:09 +0000 origin/salvage/timestamp-normalization-fix
2025-12-21 10:38:01 +0000 origin/backup-before-history-clean-20251221-142907
2025-12-19 11:09:19 +0000 origin/copilot/sub-pr-30
2025-12-16 07:35:10 +0000 origin/dependabot/npm_and_yarn/archive/workers/mcp-server-cloud/npm_and_yarn-019fbcea4a
2025-09-29 22:15:19 -0500 origin/chore/vite7-upgrade
2025-07-18 09:58:12 -0500 origin/codex/build-and-deploy-frontend-to-cloudflare-pages
```

Recommendations
- Protect `main` and the recent `cleanup/*` branches (keep).
- Candidate stale branches (manual review recommended):
  - branches with `copilot/sub-pr-*` (many appear to be ephemeral CI branches; consider deleting if PRs are closed).
  - `tmp/*`, `temp/*`, `backup-before-history-clean-*` — review and delete if no longer needed.
  - `dependabot/*` and very-old `chore/*` entries — consider closing/updating or deleting if merged.

Example commands (run after manual review):

- Delete remote branch:
  `git push origin --delete copilot/sub-pr-58`

- Delete local stale branch:
  `git branch -D copilot/sub-pr-58`

- Prune removed remote refs locally:
  `git fetch --prune`

Next steps
- I can generate a proposed branch-deletion list (one-line per branch) and create a draft PR to remove them from origin via maintainer-approved workflow, or I can run deletions now if you confirm which branches to drop.

