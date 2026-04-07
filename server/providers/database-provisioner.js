import crypto from 'crypto';
import hetzner from './hetzner.js';

const DB_SERVER_TYPES = {
  postgresql: 'cx22',
  mysql: 'cx22',
  mongodb: 'cx22',
  redis: 'cx11',
};

const DB_PORTS = {
  postgresql: 5432,
  mysql: 3306,
  mongodb: 27017,
  redis: 6379,
};

export function generatePassword(length = 24) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

function getCloudInit(dbType, dbName, username, password, port) {
  const scripts = {
    postgresql: `#!/bin/bash
set -e
apt-get update
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql

# Configure PostgreSQL for remote access
sudo -u postgres psql -c "CREATE USER ${username} WITH PASSWORD '${password}';"
sudo -u postgres psql -c "CREATE DATABASE ${dbName} OWNER ${username};"

# Allow remote connections
echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/*/main/pg_hba.conf
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf

systemctl restart postgresql

# Configure firewall
apt-get install -y ufw
ufw allow 22/tcp
ufw allow ${port}/tcp
ufw --force enable
`,
    mysql: `#!/bin/bash
set -e
apt-get update
apt-get install -y mysql-server
systemctl enable mysql

mysql -e "CREATE USER '${username}'@'%' IDENTIFIED BY '${password}';"
mysql -e "CREATE DATABASE \\\`${dbName}\\\`;"
mysql -e "GRANT ALL PRIVILEGES ON \\\`${dbName}\\\`.* TO '${username}'@'%';"
mysql -e "FLUSH PRIVILEGES;"

# Allow remote connections
sed -i 's/bind-address\\s*=\\s*127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
systemctl restart mysql

apt-get install -y ufw
ufw allow 22/tcp
ufw allow ${port}/tcp
ufw --force enable
`,
    mongodb: `#!/bin/bash
set -e
apt-get update
apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update
apt-get install -y mongodb-org
systemctl enable mongod

# Configure remote access
sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf
echo "security:" >> /etc/mongod.conf
echo "  authorization: enabled" >> /etc/mongod.conf
systemctl restart mongod

sleep 2
mongosh admin --eval "db.createUser({user: '${username}', pwd: '${password}', roles: [{role: 'readWrite', db: '${dbName}'}]})"

apt-get install -y ufw
ufw allow 22/tcp
ufw allow ${port}/tcp
ufw --force enable
`,
    redis: `#!/bin/bash
set -e
apt-get update
apt-get install -y redis-server
systemctl enable redis-server

sed -i 's/bind 127.0.0.1 -::1/bind 0.0.0.0/' /etc/redis/redis.conf
sed -i 's/# requirepass foobared/requirepass ${password}/' /etc/redis/redis.conf
sed -i 's/protected-mode yes/protected-mode no/' /etc/redis/redis.conf
systemctl restart redis-server

apt-get install -y ufw
ufw allow 22/tcp
ufw allow ${port}/tcp
ufw --force enable
`,
  };

  return scripts[dbType] || scripts.postgresql;
}

export async function provisionDatabase({ name, type = 'postgresql', region, dbName, username }) {
  const password = generatePassword();
  const port = DB_PORTS[type] || 5432;
  const serverType = DB_SERVER_TYPES[type] || 'cx22';
  const cloudInit = getCloudInit(type, dbName, username, password, port);

  const serverName = `db-${type}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const result = await hetzner.createServer({
    name: serverName,
    type: serverType === 'cx22' ? 'standard' : 'basic',
    region,
    userData: cloudInit,
  });

  return {
    hetznerServerId: String(result.server.id),
    ip: result.server.public_net?.ipv4?.ip || null,
    port,
    password,
    status: result.server.status,
  };
}

export async function destroyDatabase(hetznerServerId) {
  return hetzner.deleteServer(hetznerServerId);
}

export async function startDatabase(hetznerServerId) {
  return hetzner.powerOn(hetznerServerId);
}

export async function stopDatabase(hetznerServerId) {
  return hetzner.powerOff(hetznerServerId);
}

export { DB_PORTS, DB_SERVER_TYPES };

export default {
  provisionDatabase,
  destroyDatabase,
  startDatabase,
  stopDatabase,
  generatePassword,
  DB_PORTS,
  DB_SERVER_TYPES,
};
