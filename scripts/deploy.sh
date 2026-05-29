#!/bin/bash
set -e

echo "Running custom deployment script..."

# Generate prisma client
npx prisma generate

# Reset database ONLY in Vercel Preview (staging) environment if migrations fail
if [ "$VERCEL_ENV" = "preview" ]; then
  echo "Preview environment detected. Attempting to deploy migrations..."
  if ! npx prisma migrate deploy; then
    echo "Migration failed! Resetting preview database to recover..."
    npx prisma migrate reset --force
    echo "Database reset. Re-running migrations..."
    npx prisma migrate deploy
  fi
else
  # Production
  echo "Production environment. Deploying migrations normally..."
  npx prisma migrate deploy
fi

# Build Next.js
npx next build
