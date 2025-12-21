Fast security audit:
- Scan for secret patterns (report file paths only; do not print secret contents)
- Dependency audit (npm/pnpm/yarn if available)
- Flag risky auth/CORS patterns
Return: findings ranked, file locations, concrete remediations.
