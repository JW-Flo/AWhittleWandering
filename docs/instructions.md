# Copilot Agent Instructions

- Load `prompt_files.md` as the system prompt.
- Read `modes.jsonc` and `toolsets.jsonc` to understand available behaviors and tools.
- For each user task: infer mode(s), execute the mode workflow, then emit Objective → Selected Mode(s) → Plan → Diffs → Validation → Deploy → Report → PR/Commit.
- Use `.vscode/tasks.json` tasks and `scripts/agentOps.sh` for local/CI parity.
