# Minimal DevSecOps Copilot Pack (lean + shell integration)

Files:
- `prompts/devsecops_coding.prompt.md` — lean prompt (mode: coding).
- `DevSecOps_Minimal_Agent.toolsets.jsonc` — slim toolset.
- `.vscode/tasks.json` — `Lint+Test`, `Security Scan` tasks.
- `scripts/agentOps.sh` — runs tests/scans if tools exist.
- `scripts/install_shell_integration.sh` — installs VS Code Terminal Shell Integration line for your shell.

## Install
1) Unzip into your repo or `~/Library/Application Support/Code - Insiders/User/prompts/` for the prompt.
2) Run shell integration installer:
   ```bash
   bash scripts/install_shell_integration.sh
   ```
3) In Copilot: select **DevSecOps Minimal Agent** toolset and the **devsecops_coding** prompt.
4) Ask for work. The agent will output: Objective → Plan → Diffs → Validation → Deploy Notes → Report.

No YAML beyond the required prompt frontmatter is included. No Terraform/CI bloat.
