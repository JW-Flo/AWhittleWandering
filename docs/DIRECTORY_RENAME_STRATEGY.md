# Directory Rename Strategy: 48Continental → AWhittleWandering

This document outlines the strategy for renaming directories in the project from "48Continental" to "AWhittleWandering".

## Identified Directories Requiring Renaming

1. `/Users/joe/Projects/Personal/ContinentalUSA/48Continental`
2. `/Users/joe/Projects/Personal/ContinentalUSA/48 Continental` 
3. `/Users/joe/Projects/Personal/ContinentalUSA/48Continental_Starter`

## Renaming Approach

### Phase 1: Preparation

1. **Create a backup** of the entire repository before proceeding.
2. **Run the text content replacement script** (`rename-project.sh`) to update all file contents.
3. **Update all import statements** that reference directories being renamed.

### Phase 2: Directory Renaming

Follow this specific order to minimize dependency issues:

```bash
# 1. Rename the main source directory
mv "/Users/joe/Projects/Personal/ContinentalUSA/48Continental_Starter" "/Users/joe/Projects/Personal/ContinentalUSA/AWhittleWandering_Website"

# 2. Rename additional directories
mv "/Users/joe/Projects/Personal/ContinentalUSA/48Continental" "/Users/joe/Projects/Personal/ContinentalUSA/AWhittleWandering"
mv "/Users/joe/Projects/Personal/ContinentalUSA/48 Continental" "/Users/joe/Projects/Personal/ContinentalUSA/AWhittleWandering_Legacy"
```

### Phase 3: Configuration Updates

1. **Update all workflow files** in `.github/workflows/` that reference the old directory paths.
2. **Update `package.json` scripts** that reference old directory paths.
3. **Update tasks.json** for VS Code tasks referencing old paths.

## Critical Updates

### GitHub Workflows

The following files in `.github/workflows/` need manual path updates:

1. `deploy-all-final.yml` - Replace references to `48Continental_Starter/public-site` with `AWhittleWandering_Website/public-site`.
2. `test-edge-worker.yml` - Update any path references.

### Build Scripts

All scripts in the `scripts/` directory that have hardcoded paths must be updated.

### Project Configuration

1. Update `tsconfig.json` paths.
2. Update any Docker configuration files.
3. Update CI/CD pipeline configurations.

## Validation Strategy

1. **Run immediate tests** after renaming to verify:
   - The project builds successfully
   - All imports resolve correctly
   - No path-related errors occur

2. **Run the full test suite** to ensure all functionality works as expected.

3. **Verify deployment workflows** by running a test deployment.

## Rollback Plan

If critical issues are encountered:

1. Restore from the backup created in Phase 1.
2. Document the specific issues encountered.
3. Address each issue individually before attempting renaming again.

## Conclusion

Directory renaming requires careful coordination and should be done in a controlled environment with proper testing before and after each phase. The outlined approach minimizes risk while ensuring all references are properly updated throughout the codebase.
