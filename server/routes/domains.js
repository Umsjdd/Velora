import { Router } from 'express';
import auth from '../middleware/auth.js';
import { checkLimit } from '../middleware/planLimits.js';
import { isProviderConfigured } from '../providers/utils.js';
import cloudflare from '../providers/cloudflare.js';

const router = Router();
router.use(auth);

// GET / - List user's domains with DNS records
router.get('/', async (req, res) => {
  try {
    const domains = await req.prisma.domain.findMany({
      where: { userId: req.user.id },
      include: { dnsRecords: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: domains });
  } catch (error) {
    console.error('List domains error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch domains' });
  }
});

// POST / - Add domain
router.post('/', checkLimit('domains'), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Domain name is required' });
    }

    if (isProviderConfigured('cloudflare')) {
      // Create zone on Cloudflare
      const zone = await cloudflare.createZone(name);

      const domain = await req.prisma.domain.create({
        data: {
          name,
          status: 'pending',
          ssl: true,
          sslExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          nameservers: zone.name_servers?.join(',') || 'ns1.vestora.io,ns2.vestora.io',
          cloudflareZoneId: zone.id,
          cloudflareStatus: zone.status,
          userId: req.user.id,
        },
      });

      // Create default DNS records on Cloudflare
      const defaultRecords = [
        { type: 'A', name: '@', content: '76.76.21.21', ttl: 3600 },
        { type: 'MX', name: '@', content: 'mail.vestora.io', ttl: 3600 },
      ];

      const createdRecords = [];
      for (const rec of defaultRecords) {
        try {
          const cfRecord = await cloudflare.createDnsRecord(zone.id, rec);
          const dbRecord = await req.prisma.dnsRecord.create({
            data: {
              type: rec.type,
              name: rec.name,
              value: rec.content,
              ttl: rec.ttl,
              domainId: domain.id,
              cloudflareRecordId: cfRecord.id,
            },
          });
          createdRecords.push(dbRecord);
        } catch (err) {
          console.error(`Failed to create default DNS record ${rec.type}:`, err.message);
        }
      }

      const domainWithRecords = await req.prisma.domain.findUnique({
        where: { id: domain.id },
        include: { dnsRecords: true },
      });

      await req.prisma.activityLog.create({
        data: {
          action: 'created',
          resource: 'domain',
          details: `Added domain "${name}" — configure nameservers to activate`,
          userId: req.user.id,
        },
      });

      return res.status(201).json({ success: true, data: domainWithRecords });
    }

    // Fallback: mock mode
    const domain = await req.prisma.domain.create({
      data: {
        name,
        status: 'active',
        sslExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        userId: req.user.id,
        dnsRecords: {
          create: [
            { type: 'A', name: '@', value: '76.76.21.21', ttl: 3600 },
            { type: 'MX', name: '@', value: 'mail.vestora.io', ttl: 3600 },
          ],
        },
      },
      include: { dnsRecords: true },
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'created',
        resource: 'domain',
        details: `Added domain "${name}" with default DNS records`,
        userId: req.user.id,
      },
    });

    res.status(201).json({ success: true, data: domain });
  } catch (error) {
    console.error('Create domain error:', error);
    res.status(500).json({ success: false, error: 'Failed to add domain' });
  }
});

// GET /:id/verify - Check nameserver propagation
router.get('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;

    const domain = await req.prisma.domain.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!domain) {
      return res.status(404).json({ success: false, error: 'Domain not found' });
    }

    if (!domain.cloudflareZoneId || !isProviderConfigured('cloudflare')) {
      return res.json({ success: true, data: { status: domain.status, activated: domain.status === 'active' } });
    }

    const result = await cloudflare.checkZoneStatus(domain.cloudflareZoneId);

    if (result.activated && domain.status !== 'active') {
      await req.prisma.domain.update({
        where: { id },
        data: { status: 'active', cloudflareStatus: 'active' },
      });
    }

    res.json({
      success: true,
      data: {
        status: result.status,
        nameServers: result.nameServers,
        activated: result.activated,
      },
    });
  } catch (error) {
    console.error('Verify domain error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify domain' });
  }
});

// PUT /:id - Update domain
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, ssl } = req.body;

    const existing = await req.prisma.domain.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Domain not found' });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (ssl !== undefined) updateData.ssl = ssl;

    const domain = await req.prisma.domain.update({
      where: { id },
      data: updateData,
      include: { dnsRecords: true },
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'updated',
        resource: 'domain',
        details: `Updated domain "${domain.name}"`,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: domain });
  } catch (error) {
    console.error('Update domain error:', error);
    res.status(500).json({ success: false, error: 'Failed to update domain' });
  }
});

// DELETE /:id - Delete domain
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await req.prisma.domain.findFirst({
      where: { id, userId: req.user.id },
      include: { dnsRecords: true },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Domain not found' });
    }

    // Delete zone from Cloudflare
    if (existing.cloudflareZoneId && isProviderConfigured('cloudflare')) {
      try {
        await cloudflare.deleteZone(existing.cloudflareZoneId);
      } catch (err) {
        console.error(`Cloudflare zone delete failed for domain ${id}:`, err.message);
      }
    }

    await req.prisma.domain.delete({ where: { id } });

    await req.prisma.activityLog.create({
      data: {
        action: 'deleted',
        resource: 'domain',
        details: `Deleted domain "${existing.name}"`,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: { message: 'Domain deleted' } });
  } catch (error) {
    console.error('Delete domain error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete domain' });
  }
});

// POST /:id/dns - Add DNS record
router.post('/:id/dns', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, value, ttl = 3600 } = req.body;

    if (!type || !name || !value) {
      return res.status(400).json({ success: false, error: 'Type, name, and value are required' });
    }

    const domain = await req.prisma.domain.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!domain) {
      return res.status(404).json({ success: false, error: 'Domain not found' });
    }

    let cloudflareRecordId = null;

    // Create on Cloudflare if zone exists
    if (domain.cloudflareZoneId && isProviderConfigured('cloudflare')) {
      const cfRecord = await cloudflare.createDnsRecord(domain.cloudflareZoneId, {
        type,
        name,
        content: value,
        ttl,
      });
      cloudflareRecordId = cfRecord.id;
    }

    const record = await req.prisma.dnsRecord.create({
      data: { type, name, value, ttl, domainId: id, cloudflareRecordId },
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'created',
        resource: 'dns_record',
        details: `Added ${type} record "${name}" to ${domain.name}`,
        userId: req.user.id,
      },
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error('Create DNS record error:', error);
    res.status(500).json({ success: false, error: 'Failed to add DNS record' });
  }
});

// DELETE /:id/dns/:recordId - Delete DNS record
router.delete('/:id/dns/:recordId', async (req, res) => {
  try {
    const { id, recordId } = req.params;

    const domain = await req.prisma.domain.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!domain) {
      return res.status(404).json({ success: false, error: 'Domain not found' });
    }

    const record = await req.prisma.dnsRecord.findFirst({
      where: { id: recordId, domainId: id },
    });
    if (!record) {
      return res.status(404).json({ success: false, error: 'DNS record not found' });
    }

    // Delete from Cloudflare
    if (record.cloudflareRecordId && domain.cloudflareZoneId && isProviderConfigured('cloudflare')) {
      try {
        await cloudflare.deleteDnsRecord(domain.cloudflareZoneId, record.cloudflareRecordId);
      } catch (err) {
        console.error(`Cloudflare DNS record delete failed:`, err.message);
      }
    }

    await req.prisma.dnsRecord.delete({ where: { id: recordId } });

    await req.prisma.activityLog.create({
      data: {
        action: 'deleted',
        resource: 'dns_record',
        details: `Deleted ${record.type} record "${record.name}" from ${domain.name}`,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: { message: 'DNS record deleted' } });
  } catch (error) {
    console.error('Delete DNS record error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete DNS record' });
  }
});

export default router;
