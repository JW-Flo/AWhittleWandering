---
name: Prepare Pull Request
description: "Format the final output as a PR-ready description."
---

When the task implementation is complete and all checks pass, prepare a **pull
request description** that includes:

- **Summary & Intent:** A brief statement of *what* the change is and *why* it
  was made.
- **Implementation Details:** Key points of the solution (in bullet form, if
  suitable).
- **Risks & Rollback:** Note any risks or potential impact of the change, and
  how to rollback if issues arise.
- **Verification Evidence:** Confirmation that tests/lint/typecheck all pass,
  and mention any new tests or logs that show the fix works.
- **Checklist:** A quick checklist confirming no secrets were added, input is
  validated, important scenarios are covered by tests, and relevant documentation
  is updated (if applicable).

This PR description will be included in the pull request for reviewers. It
should be concise but comprehensive.
