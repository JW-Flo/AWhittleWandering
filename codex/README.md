# OpenAI Codex Extension Setup

This repository is configured for the OpenAI Codex extension. Multiple configuration methods are available - try them in order:

## Method 1: Extension Settings (Recommended)
1. Open Cursor Settings (`Cmd/Ctrl + ,`)
2. Search for "Codex" or "OpenAI"
3. Find the "Custom Instructions" field
4. Paste the contents of `codex/custom-instructions.txt`

## Method 2: Workspace Settings (Already Configured)
- `.vscode/settings.json` contains workspace-specific Codex configuration
- This should work automatically when you open the workspace

## Method 3: .codex File (Already Created)
- `.codex` file in the workspace root contains the instructions
- Some Codex extensions read this file automatically

## Method 4: Manual Configuration
If none of the above work:
1. Copy the contents of `codex/custom-instructions.txt`
2. Look for Codex/OpenAI extension settings in Cursor
3. Paste into any custom instructions or system prompt field

## Troubleshooting
- Restart Cursor after configuration changes
- Ensure you have the latest version of the OpenAI Codex extension
- Check the extension's documentation for specific setup requirements

This repo keeps the instructions in source control so you can reuse them across machines.