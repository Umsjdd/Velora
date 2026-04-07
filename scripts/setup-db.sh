#!/bin/sh

# Build DATABASE_URL from Replit PG* vars if not already set
if [ -z "$DATABASE_URL" ] && [ -n "$PGHOST" ]; then
  export DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"
  echo "DATABASE_URL built from PG* variables"
fi

echo "Running prisma generate..."
npx prisma generate

echo "Running prisma db push..."
npx prisma db push --accept-data-loss
