import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Vestora database...');

  // Clean existing data
  await prisma.metric.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.dnsRecord.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.database.deleteMany();
  await prisma.storageFile.deleteMany();
  await prisma.emailAccount.deleteMany();
  await prisma.server.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@vestora.io',
      password: hashedPassword,
      plan: 'growth',
    },
  });
  console.log(`Created user: ${user.email}`);

  // Create 3 servers
  const servers = await Promise.all([
    prisma.server.create({
      data: {
        name: 'Production Web',
        region: 'us-east-1',
        type: 'performance',
        cpu: 4,
        ram: 8,
        storage: 100,
        ip: '10.42.1.15',
        status: 'running',
        userId: user.id,
      },
    }),
    prisma.server.create({
      data: {
        name: 'Staging API',
        region: 'eu-west-1',
        type: 'standard',
        cpu: 2,
        ram: 4,
        storage: 50,
        ip: '10.85.3.201',
        status: 'running',
        userId: user.id,
      },
    }),
    prisma.server.create({
      data: {
        name: 'Dev Environment',
        region: 'ap-southeast-1',
        type: 'basic',
        cpu: 1,
        ram: 2,
        storage: 25,
        ip: '10.127.12.88',
        status: 'stopped',
        userId: user.id,
      },
    }),
  ]);
  console.log(`Created ${servers.length} servers`);

  // Create 5 email accounts
  const emails = await Promise.all([
    prisma.emailAccount.create({
      data: { address: 'admin', domain: 'vestora.io', storageUsed: 1240, userId: user.id },
    }),
    prisma.emailAccount.create({
      data: { address: 'support', domain: 'vestora.io', storageUsed: 890, userId: user.id },
    }),
    prisma.emailAccount.create({
      data: { address: 'hello', domain: 'vestora.io', storageUsed: 320, userId: user.id },
    }),
    prisma.emailAccount.create({
      data: { address: 'no-reply', domain: 'vestora.io', storageUsed: 50, forwardTo: 'admin@vestora.io', userId: user.id },
    }),
    prisma.emailAccount.create({
      data: { address: 'billing', domain: 'vestora.io', storageUsed: 670, userId: user.id },
    }),
  ]);
  console.log(`Created ${emails.length} email accounts`);

  // Create 2 domains with DNS records
  const domain1 = await prisma.domain.create({
    data: {
      name: 'vestora.io',
      ssl: true,
      sslExpiry: new Date('2027-03-15'),
      userId: user.id,
      dnsRecords: {
        create: [
          { type: 'A', name: '@', value: '76.76.21.21', ttl: 3600 },
          { type: 'AAAA', name: '@', value: '2606:4700::6810:85e5', ttl: 3600 },
          { type: 'MX', name: '@', value: 'mail.vestora.io', ttl: 3600 },
          { type: 'CNAME', name: 'www', value: 'vestora.io', ttl: 3600 },
          { type: 'TXT', name: '@', value: 'v=spf1 include:vestora.io ~all', ttl: 3600 },
        ],
      },
    },
  });

  const domain2 = await prisma.domain.create({
    data: {
      name: 'app.vestora.io',
      ssl: true,
      sslExpiry: new Date('2027-06-20'),
      userId: user.id,
      dnsRecords: {
        create: [
          { type: 'A', name: '@', value: '76.76.21.22', ttl: 3600 },
          { type: 'CNAME', name: 'api', value: 'app.vestora.io', ttl: 300 },
        ],
      },
    },
  });
  console.log(`Created 2 domains with DNS records`);

  // Create 2 databases
  const databases = await Promise.all([
    prisma.database.create({
      data: {
        name: 'Production DB',
        type: 'postgresql',
        region: 'us-east-1',
        size: 2480,
        maxSize: 10240,
        host: 'postgresql-a1b2c3d4.db.vestora.io',
        port: 5432,
        dbName: 'production_db',
        username: 'user_a1b2c3d4',
        status: 'running',
        userId: user.id,
      },
    }),
    prisma.database.create({
      data: {
        name: 'Cache Store',
        type: 'redis',
        region: 'us-east-1',
        size: 512,
        maxSize: 4096,
        host: 'redis-e5f6g7h8.db.vestora.io',
        port: 6379,
        dbName: 'cache_store',
        username: 'user_e5f6g7h8',
        status: 'running',
        userId: user.id,
      },
    }),
  ]);
  console.log(`Created ${databases.length} databases`);

  // Create 6 invoices (last 6 months)
  const invoiceData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    invoiceData.push({
      amount: 29.0,
      status: i === 0 ? 'pending' : 'paid',
      period: monthStr,
      userId: user.id,
      createdAt: date,
    });
  }
  for (const inv of invoiceData) {
    await prisma.invoice.create({ data: inv });
  }
  console.log(`Created ${invoiceData.length} invoices`);

  // Create 30 days of metrics
  const metricTypes = ['traffic', 'bandwidth', 'cpu'];
  const metricData = [];
  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - i);
    timestamp.setHours(12, 0, 0, 0);

    for (const type of metricTypes) {
      let value;
      switch (type) {
        case 'traffic':
          value = Math.floor(1000 + Math.random() * 2000);
          break;
        case 'bandwidth':
          value = Math.floor(500 + Math.random() * 1500);
          break;
        case 'cpu':
          value = parseFloat((20 + Math.random() * 60).toFixed(1));
          break;
      }
      metricData.push({ type, value, timestamp, userId: user.id });
    }
  }
  for (const m of metricData) {
    await prisma.metric.create({ data: m });
  }
  console.log(`Created ${metricData.length} metrics (${metricTypes.length} types x 30 days)`);

  // Create 10 activity log entries
  const activities = [
    { action: 'created', resource: 'server', details: 'Created server "Production Web" in us-east-1' },
    { action: 'created', resource: 'server', details: 'Created server "Staging API" in eu-west-1' },
    { action: 'created', resource: 'domain', details: 'Added domain "vestora.io"' },
    { action: 'created', resource: 'email', details: 'Created email account "admin@vestora.io"' },
    { action: 'created', resource: 'database', details: 'Created PostgreSQL database "Production DB"' },
    { action: 'updated', resource: 'server', details: 'Updated server "Production Web" configuration' },
    { action: 'created', resource: 'dns_record', details: 'Added CNAME record "www" to vestora.io' },
    { action: 'restart', resource: 'server', details: 'Restarted server "Staging API"' },
    { action: 'created', resource: 'email', details: 'Created email account "support@vestora.io"' },
    { action: 'updated', resource: 'plan', details: 'Changed plan to "Growth"' },
  ];

  for (let i = 0; i < activities.length; i++) {
    const createdAt = new Date(now);
    createdAt.setHours(createdAt.getHours() - (activities.length - i) * 6);
    await prisma.activityLog.create({
      data: { ...activities[i], userId: user.id, createdAt },
    });
  }
  console.log(`Created ${activities.length} activity log entries`);

  console.log('\nSeed complete!');
  console.log('Login with: demo@vestora.io / demo123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
