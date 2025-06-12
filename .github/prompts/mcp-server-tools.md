... (existing content remains above) ...

### Blackbox Secret Scan
```json
{
  "name": "blackbox_scan",
  "description": "Scans a repository path for secrets / high-risk code patterns",
  "parameters": {
    "type": "object",
    "properties": {
      "path":   { "type": "string", "description": "Filesystem path to scan (default '.')"},
      "format": { "type": "string", "enum": ["summary","full"], "default": "summary"}
    },
    "required": ["path"]
  }
}
```

### Cline-AI Architectural Advisor
```json
{
  "name": "cline_ai_design",
  "description": "Cline AI agent that proposes architecture / design improvements",
  "parameters": {
    "type": "object",
    "properties": {
      "topic":   { "type": "string", "description": "Design topic or problem statement" },
      "depth":   { "type": "string", "enum": ["overview","detailed"], "default": "detailed" }
    },
    "required": ["topic"]
  }
}
