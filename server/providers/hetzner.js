const API_BASE = 'https://api.hetzner.cloud/v1';

function headers() {
  return {
    Authorization: `Bearer ${process.env.HETZNER_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

async function request(method, path, body = null) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || `Hetzner API error: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

// Server type mapping from Vestora types to Hetzner types
const SERVER_TYPE_MAP = {
  basic: 'cx22',
  standard: 'cx22',
  performance: 'cx32',
  enterprise: 'cx42',
};

// Region mapping from Vestora regions to Hetzner locations
const LOCATION_MAP = {
  'us-east-1': 'ash',
  'us-east': 'ash',
  'us-west-1': 'hil',
  'us-west-2': 'hil',
  'us-west': 'hil',
  'eu-west-1': 'fsn1',
  'eu-central-1': 'nbg1',
  'eu-west': 'fsn1',
  'eu-central': 'nbg1',
  'ap-southeast-1': 'sin',
  'ap-south': 'sin',
};

export async function createServer({ name, type = 'standard', region, image = 'ubuntu-24.04', userData = null }) {
  const serverType = SERVER_TYPE_MAP[type] || 'cx22';
  const location = LOCATION_MAP[region] || 'fsn1';

  const body = {
    name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    server_type: serverType,
    image,
    location,
    start_after_create: true,
  };

  if (userData) {
    body.user_data = userData;
  }

  const data = await request('POST', '/servers', body);
  return data;
}

export async function getServer(serverId) {
  const data = await request('GET', `/servers/${serverId}`);
  return data.server;
}

export async function deleteServer(serverId) {
  const data = await request('DELETE', `/servers/${serverId}`);
  return data;
}

export async function powerOn(serverId) {
  const data = await request('POST', `/servers/${serverId}/actions/poweron`);
  return data.action;
}

export async function powerOff(serverId) {
  const data = await request('POST', `/servers/${serverId}/actions/poweroff`);
  return data.action;
}

export async function reboot(serverId) {
  const data = await request('POST', `/servers/${serverId}/actions/reboot`);
  return data.action;
}

export async function getServerMetrics(serverId, type = 'cpu,disk,network', period = '1h') {
  const end = new Date().toISOString();
  const start = new Date(Date.now() - parsePeriod(period)).toISOString();
  const data = await request('GET', `/servers/${serverId}/metrics?type=${type}&start=${start}&end=${end}`);
  return data.metrics;
}

export async function listServerTypes() {
  const data = await request('GET', '/server_types');
  return data.server_types;
}

function parsePeriod(period) {
  const match = period.match(/^(\d+)(h|d|m)$/);
  if (!match) return 3600000;
  const [, num, unit] = match;
  const ms = { h: 3600000, d: 86400000, m: 60000 };
  return parseInt(num) * (ms[unit] || 3600000);
}

export default {
  createServer,
  getServer,
  deleteServer,
  powerOn,
  powerOff,
  reboot,
  getServerMetrics,
  listServerTypes,
  SERVER_TYPE_MAP,
  LOCATION_MAP,
};
