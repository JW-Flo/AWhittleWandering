# Removed Duplicate Script

This directory previously contained a duplicate `agentOps.sh` script.

It was removed in favor of the consolidated root script at:

  docs/scripts/agentOps.sh

Rationale: eliminate duplication & drift risk between minimal and full variants.

If a lightweight variant is ever required again, prefer adding feature flags to the unified script instead of re-introducing parallel copies.
