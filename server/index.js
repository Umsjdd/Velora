import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import serverRoutes from './routes/servers.js';
import emailRoutes from './routes/emails.js';
import fileRoutes from './routes/files.js';
import domainRoutes from './routes/domains.js';
import databaseRoutes from './routes/databases.js';
import analyticsRoutes from './routes/analytics.js';
import monitoringRoutes from './routes/monitoring.js';
import billingRoutes from './routes/billing.js';
import { handleStripeWebhook } from './routes/webhooks.js';
import { startHealthChecker } from './services/healthChecker.js';
import { isProviderConfigured } from './providers/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Stripe webhook needs raw body — must be before express.json()
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.prisma = prisma;
  next();
}, handleStripeWebhook);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/databases', databaseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/billing', billingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.listen(PORT, () => {
  console.log(`Vestora server running on port ${PORT}`);

  // Start health checker if any provider is configured
  if (isProviderConfigured('hetzner') || isProviderConfigured('cloudflare')) {
    startHealthChecker(prisma, 60000);
  }
});

export { prisma };
export default app;
