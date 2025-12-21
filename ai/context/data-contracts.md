# Data Contracts

## Principles
- All external data is untrusted.
- Validate at boundaries (runtime schema + types).
- Version schemas; never silently rename fields.

## Telemetry
- Define canonical fields the UI consumes.
- Define transform rules from upstream -> canonical.

## Error/Degraded Modes
- live | cached | archived | error
- Always return a reason + lastUpdated when degraded.
