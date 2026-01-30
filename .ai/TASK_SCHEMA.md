# Task Schema and Issue Format

All development tasks are initiated via GitHub Issues using the **Task** issue
template. Each Task issue should include the following fields:

- **Title:** A brief, imperative summary of the task. (Example: "Fix off-by-one
  error in date range filter", "Implement caching for user profiles")

- **Description:** Detailed context and requirements for the task. This may
  include the problem to solve or feature to add, relevant logs or screenshots for
  bugs, and any constraints or acceptance criteria. Provide as much information as
  possible about expected behavior or desired outcome.

- **Risk Tier:** The estimated risk level of this task – **Low**, **Medium**,
  or **High**.
  - *Low:* Trivial changes or isolated areas (unlikely to impact other systems).
  - *Medium:* Changes of moderate complexity or in components used broadly.
  - *High:* Complex or sensitive changes (security-related, broad refactors,
    critical infrastructure).

- **Validation Criteria:** (Optional) Specific checks or tests that will confirm
  the task is done correctly. For example, reference to unit tests that should
  pass, endpoints that should return expected data, or user flows that should be
  verified.

When creating a Task issue via the template, the issue body will be formatted
with these fields for clarity. The autonomous agent will parse this information
to plan and execute the task.

**Example Issue Body:**

```md
**Description:**
The user profile page fails to load when a new user has no posts. We need to
handle the case of empty post list without crashing.

**Risk Tier:** Low

**Validation:**
- Page loads successfully for new users (no posts) without errors.
- No regression on profiles with posts (existing unit tests should continue to
  pass).
```

In the above example, the agent would understand the context (a bug in profile
page for new users), see the risk is Low (safe to auto-fix), and know the
specific validation criteria. It will then follow the CI/CD pipeline to
implement and verify the fix.

**Important:** Do not include any secrets, credentials, or sensitive information
in task descriptions. If the task involves configuration of secrets or keys,
reference them abstractly (e.g. "use API_KEY env var") rather than providing
actual values.

The agent will use this structured task data to inform its plan of attack. The
Risk Tier influences how the pipeline handles merging (e.g. auto-merge vs.
manual review), and Validation clues help the agent ensure the completion
criteria are met.
