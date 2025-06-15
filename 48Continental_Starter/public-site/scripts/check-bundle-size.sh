#!/bin/bash
# Bundle Size Check Script
# This script checks the size of JavaScript and CSS bundles in the build output
# and alerts if they exceed the recommended limits for performance

# Exit on error
set -e

# Configuration
DIST_DIR="dist"
JS_DIR="$DIST_DIR/assets"
CSS_DIR="$DIST_DIR/assets"
MAX_TOTAL_JS_SIZE=2000000  # 2MB max total JS
MAX_TOTAL_CSS_SIZE=500000  # 500KB max total CSS
MAX_SINGLE_JS_SIZE=1000000  # 1MB max for any single JS file
MAX_SINGLE_CSS_SIZE=250000  # 250KB max for any single CSS file
CRITICAL_JS_SIZE=3000000    # 3MB critical threshold for total JS
CRITICAL_CSS_SIZE=800000    # 800KB critical threshold for total CSS
GZIP_CHECK=true            # Also check gzipped sizes
WARN_IF_NO_CHUNKS=true     # Warn if code splitting is not used

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Checking bundle sizes..."

# Check if build directory exists
if [ ! -d "$DIST_DIR" ]; then
  echo -e "${RED}Error: Build directory '$DIST_DIR' not found. Run 'npm run build' first.${NC}"
  exit 1
fi

# Check if asset directories exist
if [ ! -d "$JS_DIR" ]; then
  echo -e "${YELLOW}Warning: JavaScript assets directory '$JS_DIR' not found. Checking '$DIST_DIR' for JS files.${NC}"
  JS_DIR="$DIST_DIR"
fi

if [ ! -d "$CSS_DIR" ]; then
  echo -e "${YELLOW}Warning: CSS assets directory '$CSS_DIR' not found. Checking '$DIST_DIR' for CSS files.${NC}"
  CSS_DIR="$DIST_DIR"
fi

# Find and check JS files
echo "Analyzing JavaScript bundles..."
js_files=$(find "$JS_DIR" -type f -name "*.js" | sort)
js_count=$(echo "$js_files" | wc -l)

if [ "$js_count" -eq 0 ]; then
  echo -e "${YELLOW}No JavaScript files found in '$JS_DIR'.${NC}"
else
  echo "Found $js_count JavaScript files."
  
  # Check for code splitting
  if [ "$WARN_IF_NO_CHUNKS" = true ] && [ "$js_count" -eq 1 ]; then
    echo -e "${YELLOW}Warning: Only one JavaScript file found. Consider enabling code splitting for better performance.${NC}"
  fi
  
  # Calculate total size
  total_js_size=0
  largest_js_file=""
  largest_js_size=0
  
  echo "Individual JavaScript bundle sizes:"
  for file in $js_files; do
    size=$(wc -c < "$file")
    size_kb=$(echo "scale=2; $size/1024" | bc)
    file_basename=$(basename "$file")
    
    # Format output based on size
    if [ "$size" -gt "$MAX_SINGLE_JS_SIZE" ]; then
      echo -e "  ${RED}$file_basename: ${size_kb}KB${NC} (exceeds limit of $(echo "scale=2; $MAX_SINGLE_JS_SIZE/1024" | bc)KB)"
    else
      echo -e "  ${GREEN}$file_basename: ${size_kb}KB${NC}"
    fi
    
    # Track largest file
    if [ "$size" -gt "$largest_js_size" ]; then
      largest_js_size=$size
      largest_js_file=$file_basename
    fi
    
    # Add to total
    total_js_size=$((total_js_size + size))
  done
  
  # Report on total size
  total_js_size_kb=$(echo "scale=2; $total_js_size/1024" | bc)
  total_js_size_mb=$(echo "scale=2; $total_js_size/1048576" | bc)
  
  echo ""
  echo "JavaScript bundle summary:"
  echo "  Largest bundle: $largest_js_file ($(echo "scale=2; $largest_js_size/1024" | bc)KB)"
  
  if [ "$total_js_size" -gt "$CRITICAL_JS_SIZE" ]; then
    echo -e "  ${RED}Total size: ${total_js_size_kb}KB (${total_js_size_mb}MB) - CRITICAL: Exceeds recommended limit by $(echo "scale=2; ($total_js_size-$MAX_TOTAL_JS_SIZE)/1024" | bc)KB${NC}"
    js_status="critical"
  elif [ "$total_js_size" -gt "$MAX_TOTAL_JS_SIZE" ]; then
    echo -e "  ${YELLOW}Total size: ${total_js_size_kb}KB (${total_js_size_mb}MB) - WARNING: Exceeds recommended limit by $(echo "scale=2; ($total_js_size-$MAX_TOTAL_JS_SIZE)/1024" | bc)KB${NC}"
    js_status="warning"
  else
    echo -e "  ${GREEN}Total size: ${total_js_size_kb}KB (${total_js_size_mb}MB) - OK: Within recommended limit${NC}"
    js_status="ok"
  fi
  
  # Check gzipped size if enabled
  if [ "$GZIP_CHECK" = true ] && command -v gzip > /dev/null; then
    echo ""
    echo "Estimated gzipped JavaScript sizes:"
    total_gzip_js_size=0
    
    for file in $js_files; do
      gzip_size=$(gzip -c "$file" | wc -c)
      gzip_size_kb=$(echo "scale=2; $gzip_size/1024" | bc)
      file_basename=$(basename "$file")
      
      echo -e "  ${BLUE}$file_basename: ${gzip_size_kb}KB${NC}"
      total_gzip_js_size=$((total_gzip_js_size + gzip_size))
    done
    
    total_gzip_js_size_kb=$(echo "scale=2; $total_gzip_js_size/1024" | bc)
    total_gzip_js_size_mb=$(echo "scale=2; $total_gzip_js_size/1048576" | bc)
    compression_ratio=$(echo "scale=2; 100 - ($total_gzip_js_size * 100 / $total_js_size)" | bc)
    
    echo -e "  ${BLUE}Total gzipped size: ${total_gzip_js_size_kb}KB (${total_gzip_js_size_mb}MB) - Compression ratio: ${compression_ratio}%${NC}"
  fi
fi

echo ""

# Find and check CSS files
echo "Analyzing CSS bundles..."
css_files=$(find "$CSS_DIR" -type f -name "*.css" | sort)
css_count=$(echo "$css_files" | wc -l)

if [ "$css_count" -eq 0 ]; then
  echo -e "${YELLOW}No CSS files found in '$CSS_DIR'.${NC}"
else
  echo "Found $css_count CSS files."
  
  # Calculate total size
  total_css_size=0
  largest_css_file=""
  largest_css_size=0
  
  echo "Individual CSS bundle sizes:"
  for file in $css_files; do
    size=$(wc -c < "$file")
    size_kb=$(echo "scale=2; $size/1024" | bc)
    file_basename=$(basename "$file")
    
    # Format output based on size
    if [ "$size" -gt "$MAX_SINGLE_CSS_SIZE" ]; then
      echo -e "  ${RED}$file_basename: ${size_kb}KB${NC} (exceeds limit of $(echo "scale=2; $MAX_SINGLE_CSS_SIZE/1024" | bc)KB)"
    else
      echo -e "  ${GREEN}$file_basename: ${size_kb}KB${NC}"
    fi
    
    # Track largest file
    if [ "$size" -gt "$largest_css_size" ]; then
      largest_css_size=$size
      largest_css_file=$file_basename
    fi
    
    # Add to total
    total_css_size=$((total_css_size + size))
  done
  
  # Report on total size
  total_css_size_kb=$(echo "scale=2; $total_css_size/1024" | bc)
  
  echo ""
  echo "CSS bundle summary:"
  echo "  Largest bundle: $largest_css_file ($(echo "scale=2; $largest_css_size/1024" | bc)KB)"
  
  if [ "$total_css_size" -gt "$CRITICAL_CSS_SIZE" ]; then
    echo -e "  ${RED}Total size: ${total_css_size_kb}KB - CRITICAL: Exceeds recommended limit by $(echo "scale=2; ($total_css_size-$MAX_TOTAL_CSS_SIZE)/1024" | bc)KB${NC}"
    css_status="critical"
  elif [ "$total_css_size" -gt "$MAX_TOTAL_CSS_SIZE" ]; then
    echo -e "  ${YELLOW}Total size: ${total_css_size_kb}KB - WARNING: Exceeds recommended limit by $(echo "scale=2; ($total_css_size-$MAX_TOTAL_CSS_SIZE)/1024" | bc)KB${NC}"
    css_status="warning"
  else
    echo -e "  ${GREEN}Total size: ${total_css_size_kb}KB - OK: Within recommended limit${NC}"
    css_status="ok"
  fi
  
  # Check gzipped size if enabled
  if [ "$GZIP_CHECK" = true ] && command -v gzip > /dev/null; then
    echo ""
    echo "Estimated gzipped CSS sizes:"
    total_gzip_css_size=0
    
    for file in $css_files; do
      gzip_size=$(gzip -c "$file" | wc -c)
      gzip_size_kb=$(echo "scale=2; $gzip_size/1024" | bc)
      file_basename=$(basename "$file")
      
      echo -e "  ${BLUE}$file_basename: ${gzip_size_kb}KB${NC}"
      total_gzip_css_size=$((total_gzip_css_size + gzip_size))
    done
    
    total_gzip_css_size_kb=$(echo "scale=2; $total_gzip_css_size/1024" | bc)
    compression_ratio=$(echo "scale=2; 100 - ($total_gzip_css_size * 100 / $total_css_size)" | bc)
    
    echo -e "  ${BLUE}Total gzipped size: ${total_gzip_css_size_kb}KB - Compression ratio: ${compression_ratio}%${NC}"
  fi
fi

# Final assessment
echo ""
echo "-------------------------------------"
echo "Bundle size check summary:"

if [ "$js_status" = "critical" ] || [ "$css_status" = "critical" ]; then
  echo -e "${RED}❌ Bundle size check failed with CRITICAL issues${NC}"
  echo -e "${RED}   Performance will be significantly impacted. Fix required before deployment.${NC}"
  exit 1
elif [ "$js_status" = "warning" ] || [ "$css_status" = "warning" ]; then
  echo -e "${YELLOW}⚠️ Bundle size check passed with WARNINGS${NC}"
  echo -e "${YELLOW}   Consider optimizing bundle sizes for better performance.${NC}"
  exit 0
else
  echo -e "${GREEN}✅ Bundle size check passed successfully${NC}"
  echo -e "${GREEN}   All bundle sizes are within recommended limits.${NC}"
  exit 0
fi
