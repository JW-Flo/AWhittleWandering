# Copilot Auto-Validation Instructions

## Validation Triggers
Run the validation suite automatically when:
1. A large task or project is completed
2. 25+ uncommitted changes are detected
3. Major component modifications are made
4. API endpoints are modified
5. Deployment configurations are changed

## Pre-Validation Checks
Before proceeding with changes, verify:
```javascript
// Check number of uncommitted changes
const uncommittedChanges = await git.status();
if (uncommittedChanges.length >= 25) {
    await runValidation();
}
```

## Required Validation Steps
For each major change:
1. Execute deployment validation
```javascript
await validateDeployment({
    checkEndpoints: true,
    validateContent: true,
    measurePerformance: true
});
```

2. Verify core functionality
```typescript
interface ValidationContext {
    type: 'task' | 'project' | 'changes';
    scope: string[];
    requirements: string[];
}

async function validateChanges(context: ValidationContext) {
    // Run appropriate validations based on context
}
```

## Validation Rules
- All API endpoints must be accessible
- CORS headers must be properly configured
- Content must be properly rendered
- Performance metrics must meet thresholds
- Core features must be functional

## Error Response
If validation fails:
1. Prevent deployment/commit
2. Generate detailed error report
3. Provide specific fix recommendations
4. Require re-validation after fixes

## Success Criteria
- Overall deployment score ≥80%
- No critical components missing
- All endpoints responsive
- CORS properly configured
- Content integrity verified

## Integration Pattern
```typescript
// Example integration with development workflow
before_commit: async () => {
    const changes = await getChanges();
    if (changes.length >= 25 || isLargeTask(changes)) {
        const validationResult = await validateDeployment();
        if (!validationResult.success) {
            throw new Error(
                "Validation failed. Please fix issues before proceeding:\n" +
                validationResult.recommendations.join("\n")
            );
        }
    }
}

// Example large task detection
function isLargeTask(changes: Change[]): boolean {
    return changes.some(change => 
        change.type === 'API_MODIFICATION' ||
        change.type === 'COMPONENT_UPDATE' ||
        change.type === 'DEPLOYMENT_CONFIG'
    );
}
```

## Automatic Monitoring
Monitor for:
- Large batches of changes
- Critical file modifications
- API endpoint updates
- Component rewrites
- Configuration changes

## Response Format
```typescript
interface ValidationResponse {
    success: boolean;
    score: number;
    checks: {
        endpoints: boolean;
        cors: boolean;
        content: boolean;
        performance: boolean;
    };
    recommendations: string[];
}
```

## Example Usage
```javascript
// In your commit/deployment workflow:
try {
    await validateDeployment();
    console.log("Validation passed - proceeding with deployment");
} catch (error) {
    console.error("Validation failed:", error.message);
    console.log("Required fixes:", error.recommendations);
    process.exit(1);
}
```

## Validation Context
Keep track of:
- Number of changes
- Types of changes
- Affected components
- Previous validation results
- Performance trends

## Recovery Actions
If validation fails:
1. Roll back recent changes
2. Restore last known good state
3. Apply recommended fixes
4. Re-run validation
5. Document failure reasons

## Monitoring Metrics
Track:
- Validation success rate
- Common failure points
- Performance trends
- Error patterns
- Recovery time

This ensures that Copilot maintains high standards by automatically validating significant changes and preventing potential issues from reaching production.
