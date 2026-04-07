import { Router } from 'express';
import auth from '../middleware/auth.js';
import { PLAN_LIMITS, STRIPE_PRICE_MAP } from '../config/plans.js';
import { isProviderConfigured } from '../providers/utils.js';
import stripeProvider from '../providers/stripe.js';

const router = Router();
router.use(auth);

// GET /plan - Current plan details
router.get('/plan', async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { plan: true },
    });

    const planKey = user.plan || 'starter';
    const plan = PLAN_LIMITS[planKey] || PLAN_LIMITS.starter;

    res.json({
      success: true,
      data: {
        currentPlan: planKey,
        ...plan,
      },
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch plan details' });
  }
});

// GET /invoices - User's invoices
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await req.prisma.invoice.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// GET /usage - Usage stats vs plan limits
router.get('/usage', async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { plan: true },
    });

    const planKey = user.plan || 'starter';
    const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.starter;

    const [serverCount, emailCount, files, domainCount, databaseCount] = await Promise.all([
      req.prisma.server.count({ where: { userId: req.user.id } }),
      req.prisma.emailAccount.count({ where: { userId: req.user.id } }),
      req.prisma.storageFile.findMany({
        where: { userId: req.user.id },
        select: { size: true },
      }),
      req.prisma.domain.count({ where: { userId: req.user.id } }),
      req.prisma.database.count({ where: { userId: req.user.id } }),
    ]);

    const storageUsedBytes = files.reduce((sum, f) => sum + f.size, 0);
    const storageUsedGB = storageUsedBytes / (1024 * 1024 * 1024);

    res.json({
      success: true,
      data: {
        plan: planKey,
        usage: {
          servers: { used: serverCount, limit: limits.servers },
          emails: { used: emailCount, limit: limits.emails },
          storage: { used: parseFloat(storageUsedGB.toFixed(2)), limit: limits.storage, unit: 'GB' },
          domains: { used: domainCount, limit: limits.domains },
          databases: { used: databaseCount, limit: limits.databases },
        },
      },
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch usage stats' });
  }
});

// PUT /plan - Update plan (with Stripe checkout if configured)
router.put('/plan', async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLAN_LIMITS[plan]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan. Choose from: starter, growth, scale',
      });
    }

    // If Stripe is configured, create a checkout session or update subscription
    if (isProviderConfigured('stripe')) {
      const user = await req.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { stripeCustomerId: true, stripeSubscriptionId: true, plan: true },
      });

      const priceId = STRIPE_PRICE_MAP[plan];
      if (!priceId) {
        return res.status(400).json({ success: false, error: 'Stripe price not configured for this plan' });
      }

      // If user already has a subscription, update it
      if (user.stripeSubscriptionId) {
        const subscription = await stripeProvider.updateSubscription(user.stripeSubscriptionId, priceId);

        await req.prisma.user.update({
          where: { id: req.user.id },
          data: { plan, stripePriceId: priceId },
        });

        await req.prisma.activityLog.create({
          data: {
            action: 'updated',
            resource: 'plan',
            details: `Changed plan to "${PLAN_LIMITS[plan].name}"`,
            userId: req.user.id,
          },
        });

        return res.json({
          success: true,
          data: {
            plan: { currentPlan: plan, ...PLAN_LIMITS[plan] },
          },
        });
      }

      // No subscription yet — create checkout session
      if (!user.stripeCustomerId) {
        return res.status(400).json({ success: false, error: 'No billing account. Please contact support.' });
      }

      const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';
      const session = await stripeProvider.createCheckoutSession(
        user.stripeCustomerId,
        priceId,
        `${origin}/billing?success=true`,
        `${origin}/billing?canceled=true`,
      );

      return res.json({
        success: true,
        data: {
          checkoutUrl: session.url,
        },
      });
    }

    // Fallback: no Stripe, just update the plan directly
    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: { plan },
      select: { id: true, name: true, email: true, plan: true },
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'updated',
        resource: 'plan',
        details: `Changed plan to "${PLAN_LIMITS[plan].name}"`,
        userId: req.user.id,
      },
    });

    res.json({
      success: true,
      data: {
        user,
        plan: { currentPlan: plan, ...PLAN_LIMITS[plan] },
      },
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

// POST /portal - Create Stripe customer portal session
router.post('/portal', async (req, res) => {
  try {
    if (!isProviderConfigured('stripe')) {
      return res.status(400).json({ success: false, error: 'Billing not configured' });
    }

    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { stripeCustomerId: true },
    });

    if (!user.stripeCustomerId) {
      return res.status(400).json({ success: false, error: 'No billing account found' });
    }

    const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';
    const session = await stripeProvider.createPortalSession(user.stripeCustomerId, `${origin}/billing`);

    res.json({ success: true, data: { url: session.url } });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ success: false, error: 'Failed to create portal session' });
  }
});

export default router;
