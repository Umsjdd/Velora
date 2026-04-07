const API_BASE = 'https://api.cloudflare.com/client/v4';

function headers() {
  return {
    Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

async function request(method, path, body = null) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();

  if (!data.success) {
    const msg = data.errors?.[0]?.message || `Cloudflare API error: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

// ── DNS Zone Management ──

export async function createZone(domainName) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const data = await request('POST', '/zones', {
    name: domainName,
    account: { id: accountId },
    type: 'full',
  });
  return data.result;
}

export async function getZone(zoneId) {
  const data = await request('GET', `/zones/${zoneId}`);
  return data.result;
}

export async function deleteZone(zoneId) {
  const data = await request('DELETE', `/zones/${zoneId}`);
  return data.result;
}

export async function checkZoneStatus(zoneId) {
  const zone = await getZone(zoneId);
  return {
    status: zone.status,
    nameServers: zone.name_servers,
    activated: zone.status === 'active',
  };
}

// ── DNS Record Management ──

export async function createDnsRecord(zoneId, { type, name, content, ttl = 3600, proxied = false }) {
  const data = await request('POST', `/zones/${zoneId}/dns_records`, {
    type,
    name,
    content,
    ttl: ttl === 1 ? 1 : ttl, // 1 = auto in Cloudflare
    proxied: type === 'A' || type === 'AAAA' || type === 'CNAME' ? proxied : false,
  });
  return data.result;
}

export async function updateDnsRecord(zoneId, recordId, { type, name, content, ttl = 3600, proxied = false }) {
  const data = await request('PATCH', `/zones/${zoneId}/dns_records/${recordId}`, {
    type,
    name,
    content,
    ttl,
    proxied,
  });
  return data.result;
}

export async function deleteDnsRecord(zoneId, recordId) {
  const data = await request('DELETE', `/zones/${zoneId}/dns_records/${recordId}`);
  return data.result;
}

export async function listDnsRecords(zoneId) {
  const data = await request('GET', `/zones/${zoneId}/dns_records?per_page=100`);
  return data.result;
}

// ── Email Routing ──

export async function enableEmailRouting(zoneId) {
  // Cloudflare Email Routing is enabled per-zone via the dashboard or API
  // This checks the current status
  const data = await request('GET', `/zones/${zoneId}/email/routing`);
  return data.result;
}

export async function createEmailRule(zoneId, { fromAddress, toAddress, enabled = true }) {
  const data = await request('POST', `/zones/${zoneId}/email/routing/rules`, {
    matchers: [{ type: 'literal', field: 'to', value: fromAddress }],
    actions: [{ type: 'forward', value: [toAddress] }],
    enabled,
    name: `Forward ${fromAddress}`,
  });
  return data.result;
}

export async function updateEmailRule(zoneId, ruleId, { toAddress, enabled }) {
  const updates = {};
  if (toAddress !== undefined) {
    updates.actions = [{ type: 'forward', value: [toAddress] }];
  }
  if (enabled !== undefined) {
    updates.enabled = enabled;
  }

  const data = await request('PUT', `/zones/${zoneId}/email/routing/rules/${ruleId}`, updates);
  return data.result;
}

export async function deleteEmailRule(zoneId, ruleId) {
  const data = await request('DELETE', `/zones/${zoneId}/email/routing/rules/${ruleId}`);
  return data.result;
}

export async function addDestinationAddress(accountId, email) {
  const data = await request('POST', `/accounts/${accountId}/email/routing/addresses`, {
    email,
  });
  return data.result;
}

// ── Zone Analytics ──

export async function getZoneAnalytics(zoneId, since = -1440) {
  // since in minutes (default -1440 = last 24 hours)
  const data = await request('GET', `/zones/${zoneId}/analytics/dashboard?since=${since}&continuous=true`);
  return data.result;
}

export default {
  createZone,
  getZone,
  deleteZone,
  checkZoneStatus,
  createDnsRecord,
  updateDnsRecord,
  deleteDnsRecord,
  listDnsRecords,
  enableEmailRouting,
  createEmailRule,
  updateEmailRule,
  deleteEmailRule,
  addDestinationAddress,
  getZoneAnalytics,
};
