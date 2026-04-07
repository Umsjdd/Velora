import { Router } from 'express';
import auth from '../middleware/auth.js';
import { checkLimit } from '../middleware/planLimits.js';
import { isProviderConfigured } from '../providers/utils.js';
import hetzner from '../providers/hetzner.js';

const router = Router();
router.use(auth);

const SERVER_SPECS = {
  basic: { cpu: 1, ram: 2 },
  standard: { cpu: 2, ram: 4 },
  performance: { cpu: 4, ram: 8 },
  enterprise: { cpu: 8, ram: 16 },
};

function generateIP() {
  const octet2 = Math.floor(Math.random() * 256);
  const octet3 = Math.floor(Math.random() * 256);
  const octet4 = Math.floor(Math.random() * 254) + 1;
  return `10.${octet2}.${octet3}.${octet4}`;
}

// GET / - List user's servers
router.get('/', async (req, res) => {
  try {
    const servers = await req.prisma.server.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: servers });
  } catch (error) {
    console.error('List servers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch servers' });
  }
});

// POST / - Create server
router.post('/', checkLimit('servers'), async (req, res) => {
  try {
    const { name, region, type = 'standard' } = req.body;

    if (!name || !region) {
      return res.status(400).json({ success: false, error: 'Name and region are required' });
    }

    const specs = SERVER_SPECS[type] || SERVER_SPECS.standard;

    if (isProviderConfigured('hetzner')) {
      // Create DB record with provisioning status
      const server = await req.prisma.server.create({
        data: {
          name,
          region,
          type,
          cpu: specs.cpu,
          ram: specs.ram,
          status: 'provisioning',
          userId: req.user.id,
        },
      });

      await req.prisma.activityLog.create({
        data: {
          action: 'created',
          resource: 'server',
          details: `Provisioning server "${name}" in ${region}`,
          userId: req.user.id,
        },
      });

      // Fire-and-forget: provision on Hetzner
      (async () => {
        try {
          const result = await hetzner.createServer({ name, type, region });
          const ip = result.server.public_net?.ipv4?.ip || null;

          await req.prisma.server.update({
            where: { id: server.id },
            data: {
              hetznerServerId: String(result.server.id),
              ip,
              status: 'running',
              providerStatus: result.server.status,
            },
          });
        } catch (err) {
          console.error(`Hetzner provisioning failed for server ${server.id}:`, err.message);
          await req.prisma.server.update({
            where: { id: server.id },
            data: {
              status: 'error',
              errorMessage: err.message,
            },
          });
        }
      })();

      return res.status(201).json({ success: true, data: server });
    }

    // Fallback: mock mode
    const server = await req.prisma.server.create({
      data: {
        name,
        region,
        type,
        cpu: specs.cpu,
        ram: specs.ram,
        ip: generateIP(),
        status: 'running',
        userId: req.user.id,
      },
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'created',
        resource: 'server',
        details: `Created server "${name}" in ${region}`,
        userId: req.user.id,
      },
    });

    res.status(201).json({ success: true, data: server });
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ success: false, error: 'Failed to create server' });
  }
});

// PUT /:id - Update server
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const existing = await req.prisma.server.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Server not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;

    const server = await req.prisma.server.update({
      where: { id },
      data: updateData,
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'updated',
        resource: 'server',
        details: `Updated server "${server.name}"`,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: server });
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({ success: false, error: 'Failed to update server' });
  }
});

// DELETE /:id - Delete server
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await req.prisma.server.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Server not found' });
    }

    // Delete from Hetzner if provisioned
    if (existing.hetznerServerId && isProviderConfigured('hetzner')) {
      try {
        await req.prisma.server.update({
          where: { id },
          data: { status: 'deleting' },
        });
        await hetzner.deleteServer(existing.hetznerServerId);
      } catch (err) {
        console.error(`Hetzner delete failed for server ${id}:`, err.message);
      }
    }

    await req.prisma.server.delete({ where: { id } });

    await req.prisma.activityLog.create({
      data: {
        action: 'deleted',
        resource: 'server',
        details: `Deleted server "${existing.name}"`,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: { message: 'Server deleted' } });
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete server' });
  }
});

// POST /:id/action - Server actions (start/stop/restart)
router.post('/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!action || !['start', 'stop', 'restart'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action. Use start, stop, or restart' });
    }

    const existing = await req.prisma.server.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Server not found' });
    }

    // Execute real action on Hetzner if provisioned
    if (existing.hetznerServerId && isProviderConfigured('hetzner')) {
      try {
        switch (action) {
          case 'start':
            await hetzner.powerOn(existing.hetznerServerId);
            break;
          case 'stop':
            await hetzner.powerOff(existing.hetznerServerId);
            break;
          case 'restart':
            await hetzner.reboot(existing.hetznerServerId);
            break;
        }
      } catch (err) {
        console.error(`Hetzner action "${action}" failed for server ${id}:`, err.message);
        return res.status(500).json({ success: false, error: `Failed to ${action} server: ${err.message}` });
      }
    }

    let newStatus;
    switch (action) {
      case 'start':
        newStatus = 'running';
        break;
      case 'stop':
        newStatus = 'stopped';
        break;
      case 'restart':
        newStatus = 'running';
        break;
    }

    const server = await req.prisma.server.update({
      where: { id },
      data: { status: newStatus },
    });

    await req.prisma.activityLog.create({
      data: {
        action,
        resource: 'server',
        details: `${action.charAt(0).toUpperCase() + action.slice(1)} server "${server.name}"`,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: server });
  } catch (error) {
    console.error('Server action error:', error);
    res.status(500).json({ success: false, error: 'Failed to perform action' });
  }
});

export default router;
