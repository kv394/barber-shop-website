#!/bin/bash
set -e

echo "Running custom deployment script..."

# Generate prisma client
npx prisma generate

echo "Checking branch: $VERCEL_GIT_COMMIT_REF"

if [ "$VERCEL_GIT_COMMIT_REF" = "staging" ] || [ "$VERCEL_ENV" = "preview" ]; then
  echo "Staging environment. Deploying migrations..."
  
  # Now deploy migrations using the safe connection pool script
  node scripts/safe-migrate.js
else
  # Production (main)
  echo "Production environment. Deploying migrations normally..."
  node scripts/safe-migrate.js
fi

# Build Next.js
npx next build
