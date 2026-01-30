---
name: Fix CI
description: "Analyze and fix CI/CD pipeline failures."
---

**Fix-CI Command Steps:**

1. **Identify Failure Type:** Analyze the CI failure output to categorize:
   - **Lint errors:** Code style or formatting issues
   - **Type errors:** TypeScript compilation failures
   - **Test failures:** Unit or integration test failures
   - **Build errors:** Compilation or bundling issues
   - **Security scan failures:** Detected vulnerabilities or secrets

2. **Gather Context:** Collect relevant information:
   - The specific error messages and stack traces
   - The files and line numbers involved
   - Recent changes that may have caused the failure
   - Related test files or configurations

3. **Analyze Root Cause:** Determine the underlying issue:
   - Is it a genuine bug in the code?
   - Is it a test that needs updating due to intentional changes?
   - Is it an environment or dependency issue?
   - Is it a flaky test?

4. **Generate Fix:** Produce minimal code changes to resolve:
   - For lint errors: Apply formatting fixes
   - For type errors: Add proper types or fix type mismatches
   - For test failures: Fix the code bug or update the test expectation
   - For build errors: Fix import/export issues or configuration

5. **Verify Fix:** After applying changes:
   - Re-run the specific failing check
   - Ensure no new failures are introduced
   - Confirm the fix is minimal and doesn't change unrelated code

6. **Document:** In the commit message or PR, explain:
   - What was failing
   - Why it was failing
   - How the fix resolves it

**Subagent Integration:**
This command's logic is primarily handled by the CI-Reviewer subagent
(`SUBAGENTS/ci-reviewer.md`). When preflight checks fail, the task-runner
automatically invokes the CI-Reviewer with the failure output.

**Iteration Limit:**
The fix-ci process will iterate up to MAX_ITERATIONS (default: 5) times.
If the issue cannot be resolved automatically, it will be flagged for
human review.
