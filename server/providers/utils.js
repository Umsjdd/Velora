export function isProviderConfigured(provider) {
  switch (provider) {
    case 'hetzner':
      return !!process.env.HETZNER_API_TOKEN;
    case 'cloudflare':
      return !!process.env.CLOUDFLARE_API_TOKEN && !!process.env.CLOUDFLARE_ACCOUNT_ID;
    case 'r2':
      return !!process.env.R2_ACCESS_KEY_ID && !!process.env.R2_SECRET_ACCESS_KEY && !!process.env.R2_BUCKET_NAME;
    case 'stripe':
      return !!process.env.STRIPE_SECRET_KEY;
    default:
      return false;
  }
}
