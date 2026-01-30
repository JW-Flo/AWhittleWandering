---
name: Security Audit
description: "Perform a quick security scan on the codebase."
---

**Security Audit Steps:**

- Scan the repository for any common secret patterns (API keys, credentials).
  Report file paths of any potential secrets **without** printing the secret
  values.
- Perform a dependency vulnerability audit (using the package manager's audit
  capability, e.g. `npm audit` or `pnpm audit`).
- Check for risky coding patterns (e.g. overly permissive CORS, use of `eval`,
  SQL injection vectors, etc.).
- Output a ranked list of findings with filenames and line references, and
  suggest concrete remediation steps for each.
