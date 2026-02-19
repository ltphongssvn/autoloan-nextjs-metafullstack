#!/bin/sh
set -e

echo "Running Prisma db push..."
npx prisma db push --url "$DATABASE_URL"

echo "Starting Next.js..."
exec node server.js
