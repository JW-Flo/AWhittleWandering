---
name: Security Audit
description: "Perform a comprehensive security audit of the codebase."
---

**Audit Command Steps:**

1. **Secret Scan:** Run `scripts/security-scan.sh` to detect any hardcoded
   secrets, API keys, or credentials in the codebase. Report file paths of
   findings without exposing actual values.

2. **Dependency Audit:** Execute the package manager's audit command:
   - npm: `npm audit`
   - pnpm: `pnpm audit`
   - yarn: `yarn audit`
   
   Report any vulnerabilities found with severity levels.

3. **Code Pattern Analysis:** Scan for risky coding patterns:
   - Overly permissive CORS configurations
   - Use of `eval()` or similar dynamic code execution
   - SQL injection vectors (raw query construction)
   - XSS vulnerabilities (unescaped output)
   - Insecure cryptographic practices

4. **Configuration Review:** Check deployment and runtime configurations:
   - Verify no secrets in `wrangler.toml` or similar config files
   - Ensure environment variables are properly referenced
   - Check for debug modes enabled in production configs

5. **Output Format:** Provide a ranked list of findings:
   ```
   CRITICAL: [file:line] Description
   HIGH: [file:line] Description
   MEDIUM: [file:line] Description
   LOW: [file:line] Description
   ```

6. **Remediation:** For each finding, suggest concrete remediation steps.

**Integration with CI:**
This command is automatically invoked by the task-runner when security issues
are detected. The Security-Linter subagent will process the output and attempt
automated fixes where safe to do so.
