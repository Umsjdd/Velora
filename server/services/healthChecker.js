import { isProviderConfigured } from '../providers/utils.js';
import hetzner from '../providers/hetzner.js';
import net from 'net';

let intervalHandle = null;

async function checkTcpPort(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function checkServers(prisma) {
  if (!isProviderConfigured('hetzner')) return;

  const servers = await prisma.server.findMany({
    where: {
      hetznerServerId: { not: null },
      status: { in: ['running', 'stopped', 'provisioning'] },
    },
  });

  for (const server of servers) {
    try {
      const hetznerServer = await hetzner.getServer(server.hetznerServerId);
      const realStatus = hetznerServer.status === 'running' ? 'running' : 'stopped';

      if (server.status === 'provisioning' && hetznerServer.status === 'running') {
        // Server finished provisioning
        await prisma.server.update({
          where: { id: server.id },
          data: {
            status: 'running',
            ip: hetznerServer.public_net?.ipv4?.ip || server.ip,
            providerStatus: hetznerServer.status,
          },
        });
      } else if (server.status !== realStatus && server.status !== 'provisioning') {
        await prisma.server.update({
          where: { id: server.id },
          data: { status: realStatus, providerStatus: hetznerServer.status },
        });
      }

      // Record uptime metric
      await prisma.metric.create({
        data: {
          type: 'server_health',
          value: hetznerServer.status === 'running' ? 1 : 0,
          userId: server.userId,
        },
      });
    } catch (err) {
      console.error(`Health check failed for server ${server.id}:`, err.message);

      await prisma.metric.create({
        data: {
          type: 'server_health',
          value: 0,
          userId: server.userId,
        },
      });
    }
  }
}

async function checkDatabases(prisma) {
  const databases = await prisma.database.findMany({
    where: {
      host: { not: null },
      status: { in: ['running', 'provisioning'] },
    },
  });

  for (const db of databases) {
    if (!db.host || !db.port) continue;

    try {
      // For provisioning databases with Hetzner, check the VM status
      if (db.status === 'provisioning' && db.hetznerServerId && isProviderConfigured('hetzner')) {
        const hetznerServer = await hetzner.getServer(db.hetznerServerId);
        if (hetznerServer.status === 'running') {
          // VM is up, try connecting to the DB port
          const reachable = await checkTcpPort(hetznerServer.public_net?.ipv4?.ip || db.host, db.port);
          if (reachable) {
            await prisma.database.update({
              where: { id: db.id },
              data: {
                status: 'running',
                host: hetznerServer.public_net?.ipv4?.ip || db.host,
                providerStatus: 'running',
              },
            });
          }
        }
        continue;
      }

      // For running databases, check TCP connectivity
      const reachable = await checkTcpPort(db.host, db.port);

      await prisma.metric.create({
        data: {
          type: 'database_health',
          value: reachable ? 1 : 0,
          userId: db.userId,
        },
      });

      if (!reachable && db.status === 'running') {
        await prisma.activityLog.create({
          data: {
            action: 'stopped',
            resource: 'database',
            details: `Database "${db.name}" is unreachable at ${db.host}:${db.port}`,
            userId: db.userId,
          },
        });
      }
    } catch (err) {
      console.error(`Health check failed for database ${db.id}:`, err.message);
    }
  }
}

async function runHealthChecks(prisma) {
  try {
    await Promise.allSettled([
      checkServers(prisma),
      checkDatabases(prisma),
    ]);
  } catch (err) {
    console.error('Health checker error:', err);
  }
}

export function startHealthChecker(prisma, intervalMs = 60000) {
  console.log(`Health checker started (interval: ${intervalMs / 1000}s)`);

  // Run immediately on start
  runHealthChecks(prisma);

  intervalHandle = setInterval(() => runHealthChecks(prisma), intervalMs);
  return intervalHandle;
}

export function stopHealthChecker() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

export default { startHealthChecker, stopHealthChecker };
