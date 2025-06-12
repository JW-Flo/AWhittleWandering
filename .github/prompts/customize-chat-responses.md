# Chat-Response Customisation (extracted from “Customize chat responses in VS Code” PDF)

---
purpose: "global"
languages: ["*"]
---

## How Copilot Builds Each Reply

1. **System prompt** – Provided by GitHub.  
2. **Instruction files** – Every `.md` file in `.github/instructions/**` (order configurable).  
3. **Prompt snippets** – All `.md` files in `.github/prompts/**`.  
4. **User message** + implicit editor context.

## Prompt / Instruction Techniques

| Technique | Example |
|-----------|---------|
| **Reusable snippet** | Place in `.github/prompts/concise.md` → Copilot will always try to answer in ≤ 5 sentences. |
| **Front-matter filtering** |```yaml\n---\nlanguages: [\"typescript\"]\npurpose:   \"edge-worker review\"\n---\nAlways check CORS headers …\n```Only applied when active file language matches. |
| **Variable substitution** | Use `${relativeFile}`, `${selectedText}`, `${workspaceFolder}` inside prompt text – Copilot replaces them at runtime. |
| **Preferred order** | In `settings.json` add: `"github.copilot.chat.preferredPromptOrder": [\"00-project-principles.md\",\"01-concise.md\"]` |

## Recommended Files for 48 Continental

| File | Purpose |
|------|---------|
| `.github/instructions/00-project-principles.md` | Core coding / deployment rules. |
| `.github/prompts/01-validation.md` | “Before proposing a commit, run `copilot-deployment-validation.js` and summarise the result.” |
| `.github/prompts/02-style-guide.md` | Code-style examples & lint rules. |

## Quick Reference

```jsonc
// settings.json
"chat.promptFilesLocations":      { ".github/prompts": true },
"chat.instructionsFilesLocations":{ ".github/instructions": true },
"github.copilot.chat.preferredPromptOrder": [
  "00-project-principles.md",
  "01-validation.md",
  "02-style-guide.md"
]
```

With this file in `.github/prompts/`, Copilot now “knows” the PDF guidance without needing the PDF itself.
