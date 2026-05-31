#!/bin/bash
set -e

echo "Running custom deployment script..."

# Generate prisma client
npx prisma generate

echo "Checking branch: $VERCEL_GIT_COMMIT_REF"

if [ "$VERCEL_GIT_COMMIT_REF" = "staging" ] || [ "$VERCEL_ENV" = "preview" ]; then
  echo "Staging environment. Attempting safe migration recovery..."
  # If the database has a failed state for the hardening migration, roll it back
  npx prisma migrate resolve --rolled-back 20260528100000_hardening || true
  # Also roll back baseline_drift so it re-runs and executes the drift SQL we just added
  npx prisma migrate resolve --rolled-back 20260528000000_baseline_drift || true
  npx prisma migrate resolve --rolled-back 20260531000000_enable_rls || true
  
  # Now deploy migrations using the safe connection pool script
  node scripts/safe-migrate.js
else
  # Production (main)
  echo "Production environment. Deploying migrations normally..."
  node scripts/safe-migrate.js
fi

# Build Next.js
npx next build
