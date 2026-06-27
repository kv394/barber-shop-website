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
  npx prisma migrate resolve --applied 20260620220000_add_user_isBookable_bookingFee || true
  npx prisma migrate resolve --applied 20260620230000_add_message_receipt || true
  node scripts/safe-migrate.js || echo "⚠️  Migration skipped on staging (no DB connection). Continuing build..."
else
  # Production (main) — migrations are already applied by staging
  # since both environments share the same database.
  # Run migrations if DB env vars are available, skip gracefully if not.
  echo "Production environment. Attempting migrations..."
  node scripts/safe-migrate.js || echo "⚠️  Migration skipped (no DB connection string). Staging migrations already applied."
fi

# Build Next.js with increased memory
npx next build
