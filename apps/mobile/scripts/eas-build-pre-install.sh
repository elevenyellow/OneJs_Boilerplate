#!/bin/bash
set -e

echo "🔧 EAS Build Pre-Install Hook - Cleaning monorepo artifacts..."

# Remove root package.json and lockfiles that cause workspace resolution
if [ -f "../../package.json" ]; then
    echo "Removing ../../package.json"
    rm -f ../../package.json
fi

if [ -f "../../bun.lock" ]; then
    echo "Removing ../../bun.lock"
    rm -f ../../bun.lock
fi

if [ -f "../../yarn.lock" ]; then
    echo "Removing ../../yarn.lock"
    rm -f ../../yarn.lock
fi

# Remove workspace directories that might interfere
rm -rf ../../packages 2>/dev/null || true
rm -rf ../../.oneJs 2>/dev/null || true

echo "✅ Pre-install cleanup complete"
