#!/bin/bash
# Autonomous unused import cleaner
cd /Users/joe/Projects/Personal/ContinentalUSA/frontend

echo "🧹 Autonomous unused import cleanup..."

# Common unused imports to remove systematically
unused_patterns=(
    "import.*Badge.*from.*never used"
    "import.*useEffect.*from.*never used"  
    "import.*formatTemperature.*from.*never used"
    "import.*Card,.*from.*never used"
    "import.*Button.*from.*never used"
    "import.*Clock.*from.*never used"
    "import.*Calendar.*from.*never used"
    "import.*Shield.*from.*never used"
    "import.*Upload.*from.*never used"
    "import.*Video.*from.*never used"
    "import.*Filter.*from.*never used"
    "import.*Tag.*from.*never used"
    "import.*MoreVertical.*from.*never used"
    "import.*Battery.*from.*never used"
    "import.*Fuel.*from.*never used"
    "import.*Play.*from.*never used"
    "import.*Target.*from.*never used"
)

# Get lint output and find files with unused imports
npm run lint 2>&1 | grep "is defined but never used" | while read -r line; do
    # Extract filename and unused variable
    if [[ $line =~ .*src/([^:]+).*warning.*\'([^\']+)\'.*is.defined.but.never.used ]]; then
        file="src/${BASH_REMATCH[1]}"
        unused_var="${BASH_REMATCH[2]}"
        
        echo "📝 Found unused: $unused_var in $file"
        
        # Skip function parameters and certain variables
        if [[ $unused_var =~ ^(index|_|error|address|currentLocation)$ ]]; then
            continue
        fi
        
        # Try to remove the unused import
        if [[ -f "$file" ]]; then
            # Remove from import statement
            sed -i '' "s/, *$unused_var//g; s/$unused_var, *//g; s/{ *$unused_var *}//g" "$file"
        fi
    fi
done

echo "✅ Unused import cleanup complete"
