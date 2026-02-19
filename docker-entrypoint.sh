#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma db push --skip-generate --url "$DATABASE_URL"

echo "Seeding database..."
npx tsx prisma/seed.ts || echo "Seed skipped or already run"

echo "Starting Next.js..."
exec node server.js
