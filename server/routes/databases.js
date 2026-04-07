import { Router } from 'express';
import crypto from 'crypto';
import auth from '../middleware/auth.js';
import { checkLimit } from '../middleware/planLimits.js';
import { isProviderConfigured } from '../providers/utils.js';
import databaseProvisioner from '../providers/database-provisioner.js';
import hetzner from '../providers/hetzner.js';

const router = Router();
router.use(auth);

const DB_PORTS = {
  postgresql: 5432,
  mysql: 3306,
  mongodb: 27017,
  redis: 6379,
};

// GET / - List user's databases
router.get('/', async (req, res) => {
  try {
    const databases = await req.prisma.database.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: databases });
  } catch (error) {
    console.error('List databases error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch databases' });
  }
});

// POST / - Create database
router.post('/', checkLimit('databases'), async (req, res) => {
  try {
    const { name, type = 'postgresql', region } = req.body;

    if (!name || !region) {
      return res.status(400).json({ success: false, error: 'Name and region are required' });
    }

    const port = DB_PORTS[type] || 5432;
    const shortId = crypto.randomBytes(4).toString('hex');
    const dbName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const username = `user_${shortId}`;

    if (isProviderConfigured('hetzner')) {
      // Create DB record with provisioning status
      const database = await req.prisma.database.create({
        data: {
          name,
          type,
          region,
          port,
          dbName,
          username,
          status: 'provisioning',
          userId: req.user.id,
        },
      });

      await req.prisma.activityLog.create({
        data: {
          action: 'created',
          resource: 'database',
          details: `Provisioning ${type} database "${name}" in ${region}`,
          userId: req.user.id,
        },
      });

      // Fire-and-forget: provision on Hetzner
      (async () => {
        try {
          const result = await databaseProvisioner.provisionDatabase({
            name,
            type,
            region,
            dbName,
            username,
          });

          await req.prisma.database.update({
            where: { id: database.id },
            data: {
              hetznerServerId: result.hetznerServerId,
              host: result.ip,
              dbPassword: result.password,
              status: result.ip ? 'running' : 'provisioning',
              providerStatus: result.status,
              connectionString: result.ip
                ? buildConnectionString(type, username, result.password, result.ip, port, dbName)
                : null,
            },
          });
        } catch (err) {
          console.error(`Database provisioning failed for ${database.id}:`, err.message);
          await req.prisma.database.update({
            where: { id: database.id },
            data: {
              status: 'error',
              errorMessage: err.message,
            },
          });
        }
      })();

      return res.status(201).json({ success: true, data: database });
    }

    // Fallback: mock mode
    const host = `${type}-${shortId}.db.vestora.io`;

    const database = await req.prisma.database.create({
      data: {
        name,
        type,
        region,
        host,
        port,
        dbName,
        username,
        status: 'running',
        userId: req.user.id,
      },
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'created',
        resource: 'database',
        details: `Created ${type} database "${name}" in ${region}`,
        userId: req.user.id,
      },
    });

    res.status(201).json({ success: true, data: database });
  } catch (error) {
    console.error('Create database error:', error);
    res.status(500).json({ success: false, error: 'Failed to create database' });
  }
});

// PUT /:id - Update database
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const existing = await req.prisma.database.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Database not found' });
    }

    // Handle start/stop via Hetzner if provisioned
    if (status && existing.hetznerServerId && isProviderConfigured('hetzner')) {
      try {
        if (status === 'running') {
          await databaseProvisioner.startDatabase(existing.hetznerServerId);
        } else if (status === 'stopped') {
          await databaseProvisioner.stopDatabase(existing.hetznerServerId);
        }
      } catch (err) {
        console.error(`Database action failed for ${id}:`, err.message);
        return res.status(500).json({ success: false, error: `Failed to change database status: ${err.message}` });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;

    const database = await req.prisma.database.update({
      where: { id },
      data: updateData,
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'updated',
        resource: 'database',
        details: `Updated database "${database.name}"`,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: database });
  } catch (error) {
    console.error('Update database error:', error);
    res.status(500).json({ success: false, error: 'Failed to update database' });
  }
});

// DELETE /:id - Delete database
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await req.prisma.database.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Database not found' });
    }

    // Destroy Hetzner VM if provisioned
    if (existing.hetznerServerId && isProviderConfigured('hetzner')) {
      try {
        await databaseProvisioner.destroyDatabase(existing.hetznerServerId);
      } catch (err) {
        console.error(`Hetzner VM delete failed for database ${id}:`, err.message);
      }
    }

    await req.prisma.database.delete({ where: { id } });

    await req.prisma.activityLog.create({
      data: {
        action: 'deleted',
        resource: 'database',
        details: `Deleted database "${existing.name}"`,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: { message: 'Database deleted' } });
  } catch (error) {
    console.error('Delete database error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete database' });
  }
});

function buildConnectionString(type, username, password, host, port, dbName) {
  switch (type) {
    case 'postgresql':
      return `postgresql://${username}:${password}@${host}:${port}/${dbName}`;
    case 'mysql':
      return `mysql://${username}:${password}@${host}:${port}/${dbName}`;
    case 'mongodb':
      return `mongodb://${username}:${password}@${host}:${port}/${dbName}`;
    case 'redis':
      return `redis://:${password}@${host}:${port}`;
    default:
      return `${type}://${username}:${password}@${host}:${port}/${dbName}`;
  }
}

export default router;
