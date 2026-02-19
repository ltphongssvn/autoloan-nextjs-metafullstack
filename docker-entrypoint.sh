#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma db push --url "$DATABASE_URL"

echo "Seeding database..."
npx prisma db seed --url "$DATABASE_URL" || echo "Seed skipped or already run"

echo "Starting Next.js..."
exec node server.js
