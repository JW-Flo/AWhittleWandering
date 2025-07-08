#!/bin/bash

# Simple build and test script
# Just builds the site and checks if it works

echo "🚀 Building the site..."

cd 48Continental_Starter/public-site

# Install dependencies
bun install

# Build the site
bun run build

# Check if build was successful
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo "✅ Build successful! Site is ready for deployment."
    echo "📁 Build output is in: 48Continental_Starter/public-site/dist"
else
    echo "❌ Build failed or no output generated"
    exit 1
fi
