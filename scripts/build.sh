#!/bin/bash

# Build Script
# This script builds all services for production.
# Usage: ./scripts/build.sh

set -e

echo "Building all services for production..."

# Set NODE_ENV to production
export NODE_ENV=production

# Build all services using Turborepo
pnpm build

echo "Build complete!" 