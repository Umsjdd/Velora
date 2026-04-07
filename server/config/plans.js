export const PLAN_LIMITS = {
  starter: {
    name: 'Starter',
    price: 9,
    servers: 1,
    emails: 5,
    storage: 50,
    domains: 1,
    databases: 1,
  },
  growth: {
    name: 'Growth',
    price: 29,
    servers: 3,
    emails: 25,
    storage: 250,
    domains: 5,
    databases: 5,
  },
  scale: {
    name: 'Scale',
    price: 79,
    servers: 999,
    emails: 999,
    storage: 1024,
    domains: 999,
    databases: 999,
  },
};

export const STRIPE_PRICE_MAP = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  scale: process.env.STRIPE_PRICE_SCALE,
};
