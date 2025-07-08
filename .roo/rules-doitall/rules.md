# DO-IT-ALL AUTOPILOT — v3.1

1. git pull --ff-only

2. Detect impacted folders → choose prefix (edge, ios, cli, shared, docs)

3. Create branch `roo/<prefix>/<slug>`

4. Implement change; run local checks **inside MCP**:
     mcp run -- wrangler dev
     mcp run -- bun run codegen:ts
     mcp run -- swift run tools/codegen-swift
     mcp run -- npm test
     mcp run -- xcodebuild test -scheme MCPClient -destination 'generic/platform=iOS'
     npx commitlint --from HEAD~1

5. Open PR (`gh pr create`) with checklist:
     - [ ] CI green
     - [ ] diff < 1000 LOC
     - [ ] CODEOWNER review

6. Auto-merge (squash) when CI ✅ and review given. Tag backup `pre-<sha>`.

7. Monitor main 30 min; if red → `git revert -m1 <merge>` push, comment 🛑 rollback.

8. If ios-ci upload successful → mark DONE_CRITERIA #3 satisfied.

SPECIAL NOTES
• Prepend every xcodebuild / fastlane / archive command with `mcp run --`
  to run on the remote Mac build fleet.
• Update `openapi.yaml` first, then regenerate TS & Swift SDKs.
• After route CSV changes, trigger `gh workflow run charging-plan.yml`.
• Maintain CORS headers & constant-time HMAC compare in Worker.