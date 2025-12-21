Goal: Fix a data-contract mismatch without breaking UI.

Steps:
1) Find producer shape (API/worker) + consumer shape (UI/types).
2) Add runtime schema validation at boundary.
3) Map upstream -> canonical (do not spread upstream fields into UI).
4) Add/extend fixture + contract test.
5) Ensure UI shows explicit state: live|cached|archived|error.

Deliver:
- root cause
- minimal diff blocks with paths
- tests added/updated
- risk + rollback
