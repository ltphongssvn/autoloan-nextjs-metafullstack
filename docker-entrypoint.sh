#!/bin/sh
set -e

echo "Running Prisma db push..."
npx prisma db push --skip-generate

echo "Seeding database..."
npx prisma db seed || echo "Seed skipped or already run"

echo "Starting Next.js..."
exec node server.js
