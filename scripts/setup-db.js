// Build DATABASE_URL from Replit PG* environment variables if not already set
if (!process.env.DATABASE_URL && process.env.PGHOST) {
  const { PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE } = process.env;
  const url = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
  process.env.DATABASE_URL = url;
  console.log('DATABASE_URL built from PG* variables');
}

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL is set');
} else {
  console.warn('WARNING: DATABASE_URL is not set. Prisma commands may fail.');
}
