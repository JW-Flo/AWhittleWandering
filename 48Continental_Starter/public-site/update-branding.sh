#!/bin/bash
# The Wandering Whittle - Branding Update Script
# This script updates all references to "48 Continental USA" to "The Wandering Whittle"

# Exit on error
set -e

# Display execution steps
set -x

# Go to the script's directory
cd "$(dirname "$0")"

echo "===== Starting Branding Update ====="
echo "Updating from '48 Continental USA' to 'The Wandering Whittle'"

# Count occurrences before updating
OLD_BRANDING_COUNT_FULL=$(grep -r --include="*.js" --include="*.jsx" --include="*.html" --include="*.css" --include="*.md" "48 Continental USA" . | wc -l | tr -d ' ')
OLD_BRANDING_COUNT_SHORT=$(grep -r --include="*.js" --include="*.jsx" --include="*.html" --include="*.css" --include="*.md" "48Continental" . | wc -l | tr -d ' ')

echo "Found $OLD_BRANDING_COUNT_FULL instances of '48 Continental USA'"
echo "Found $OLD_BRANDING_COUNT_SHORT instances of '48Continental'"

# Update the full brand name
echo "Updating full brand name..."
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.html" -o -name "*.css" -o -name "*.md" \) -exec sed -i '' 's/48 Continental USA/The Wandering Whittle/g' {} \;
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.html" -o -name "*.css" -o -name "*.md" \) -exec sed -i '' 's/48 Continental/The Wandering Whittle/g' {} \;

# Update variations and short references
echo "Updating variations and short references..."
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.html" -o -name "*.css" -o -name "*.md" \) -exec sed -i '' 's/48Continental/WanderingWhittle/g' {} \;
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.html" -o -name "*.css" -o -name "*.md" \) -exec sed -i '' 's/Continental USA/Wandering Whittle/g' {} \;

# Update names in routes and domain references
echo "Updating domain and route references..."
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.html" -o -name "*.toml" -o -name "*.sh" \) -exec sed -i '' 's/continentalusa-site/wandering-whittle/g' {} \;
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.html" -o -name "*.toml" -o -name "*.sh" \) -exec sed -i '' 's/continentalusa\.com/thewanderingwhittle\.com/g' {} \;

# Check for any remaining references
echo "Checking for any missed references..."
MISSED_FULL=$(grep -r --include="*.js" --include="*.jsx" --include="*.html" --include="*.css" --include="*.md" "48 Continental USA" . | wc -l | tr -d ' ')
MISSED_SHORT=$(grep -r --include="*.js" --include="*.jsx" --include="*.html" --include="*.css" --include="*.md" "48Continental" . | wc -l | tr -d ' ')

# Report results
echo "===== Branding Update Complete ====="
echo "Updated $OLD_BRANDING_COUNT_FULL instances of '48 Continental USA'"
echo "Updated $OLD_BRANDING_COUNT_SHORT instances of '48Continental'"

if [ "$MISSED_FULL" -gt 0 ] || [ "$MISSED_SHORT" -gt 0 ]; then
  echo "WARNING: Found $MISSED_FULL remaining instances of '48 Continental USA'"
  echo "WARNING: Found $MISSED_SHORT remaining instances of '48Continental'"
  echo "Some files might require manual updates"
else
  echo "✅ All branding references successfully updated!"
fi

echo "Done! The site is now branded as 'The Wandering Whittle'"
