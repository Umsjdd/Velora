# Vestora

A cloud management and hosting platform (SaaS-in-a-box) providing a unified dashboard to provision and manage cloud resources: virtual servers, databases, email accounts, domains, and object storage.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router + Recharts + Lucide React
- **Backend**: Node.js + Express (port 3001)
- **Database**: PostgreSQL via Prisma ORM
- **External integrations**: Hetzner Cloud, Cloudflare, AWS S3/Cloudflare R2, Stripe

## Project Structure

```
/
├── server/           # Express backend
│   ├── routes/       # API endpoints (auth, servers, billing, etc.)
│   ├── providers/    # Hetzner, Cloudflare, R2, Stripe integrations
│   ├── middleware/   # JWT auth, plan limits
│   ├── services/     # Health checker
│   └── seed.js       # Database seeding
├── prisma/
│   └── schema.prisma # DB schema (User, Server, Domain, Database, Invoice, etc.)
├── dashboard/        # React frontend
│   ├── src/
│   │   ├── pages/    # Dashboard views
│   │   ├── components/ # Reusable UI components
│   │   ├── context/  # AuthContext
│   │   └── lib/      # API client utilities
│   └── vite.config.js
└── package.json      # Root package.json with dev scripts
```

## Development

- `npm run dev` — runs both frontend (port 5000) and backend (port 3001) concurrently
- `npm run db:push` — sync Prisma schema to database
- `npm run seed` — seed the database with demo data

## Demo Credentials

- Email: `demo@vestora.io`
- Password: `demo123`

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-configured by Replit)
- `JWT_SECRET` — JWT signing secret
- `HETZNER_API_TOKEN` — Hetzner Cloud API token
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token
- `CLOUDFLARE_ZONE_ID` — Cloudflare zone ID
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `R2_ACCESS_KEY_ID` — Cloudflare R2 access key
- `R2_SECRET_ACCESS_KEY` — Cloudflare R2 secret key
- `R2_BUCKET_NAME` — R2 bucket name
- `R2_ENDPOINT` — R2 endpoint URL

## Notes

- The frontend proxies `/api` requests to the backend at `localhost:3001`
- Providers (Hetzner, Cloudflare, Stripe, R2) are optional — the app works without them in demo mode
- Vite is configured with `allowedHosts: true` for Replit proxy compatibility
