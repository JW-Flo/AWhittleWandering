#############################################
####  DO-IT-ALL  AUTOPILOT  —  v3.1      ####
#############################################

LOOP
Every 10 min (or when activated):
  1. git pull --ff-only
  2. Queue tasks:
       • Any failing workflow (gh actions list)
       • Open issues labelled bug|blocker|roadtrip
       • TODO / FIXME comments (ripgrep)
       • If CI green >24 h and no TestFlight line → “release-candidate” task
  3. Pop highest-priority task → run STANDARD_WORKFLOW
  4. Repeat until DONE_CRITERIA met.

DONE_CRITERIA
• All workflows success  
• `gh issue list --label bug,blocker --state open` empty  
• Latest ios-ci.yml log contains “✅ Uploaded to TestFlight”

STANDARD_WORKFLOW
1. Detect impacted folders → choose prefix (edge, ios, cli, shared, docs)
2. Create branch `roo/<prefix>/<slug>`
3. Implement change; run local checks **inside MCP**:
     mcp run -- wrangler dev --dry-run
     mcp run -- npm run codegen:ts
     mcp run -- swift run tools/codegen-swift
     mcp run -- npm test
     mcp run -- xcodebuild test -scheme MCPClient -destination 'generic/platform=iOS'
     npx commitlint --from HEAD~1
4. Open PR (`gh pr create`) with checklist:
     - [ ] CI green
     - [ ] diff < 1000 LOC
     - [ ] CODEOWNER review
5. Auto-merge (squash) when CI ✅ and review given. Tag backup `pre-<sha>`.
6. Monitor main 30 min; if red → `git revert -m1 <merge>` push, comment 🛑 rollback.
7. If ios-ci upload successful → mark DONE_CRITERIA #3 satisfied.

SPECIAL NOTES
• Prepend every xcodebuild / fastlane / archive command with `mcp run --`
  to run on the remote Mac build fleet.
• Update `openapi.yaml` first, then regenerate TS & Swift SDKs.
• After route CSV changes, trigger `gh workflow run charging-plan.yml`.
• Maintain CORS headers & constant-time HMAC compare in Worker.

#############################################