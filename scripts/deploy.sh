#!/bin/bash
set -e

echo "Running custom deployment script..."

# Increase Node memory to prevent EPIPE errors during large builds
export NODE_OPTIONS="--max-old-space-size=4096"

# Generate prisma client
npx prisma generate

echo "Checking branch: $VERCEL_GIT_COMMIT_REF"

if [ "$VERCEL_GIT_COMMIT_REF" = "staging" ] || [ "$VERCEL_ENV" = "preview" ]; then
  echo "Staging environment. Deploying migrations..."
  
  # Now deploy migrations using the safe connection pool script
  npx prisma migrate resolve --rolled-back 20260602000000_optimize_indexes || true
  node scripts/safe-migrate.js
else
  # Production (main)
  echo "Production environment. Deploying migrations normally..."
  node scripts/safe-migrate.js
fi

# Build Next.js with increased memory
npx next build
