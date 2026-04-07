import { isProviderConfigured } from '../providers/utils.js';
import stripeProvider from '../providers/stripe.js';
import { PLAN_LIMITS } from '../config/plans.js';

// Reverse map Stripe price IDs to plan keys
function getPlanKeyFromPriceId(priceId) {
  for (const [key, val] of Object.entries({
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    scale: process.env.STRIPE_PRICE_SCALE,
  })) {
    if (val === priceId) return key;
  }
  return null;
}

export async function handleStripeWebhook(req, res) {
  if (!isProviderConfigured('stripe')) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeProvider.constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const prisma = req.prisma;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (subscriptionId) {
          const subscription = await stripeProvider.getSubscription(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id;
          const planKey = getPlanKeyFromPriceId(priceId);

          const user = await prisma.user.findUnique({
            where: { stripeCustomerId: customerId },
          });

          if (user && planKey) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                plan: planKey,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
              },
            });

            await prisma.activityLog.create({
              data: {
                action: 'updated',
                resource: 'plan',
                details: `Subscribed to "${PLAN_LIMITS[planKey]?.name || planKey}" plan via Stripe`,
                userId: user.id,
              },
            });
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.invoice.create({
            data: {
              amount: invoice.amount_paid / 100,
              status: 'paid',
              period: `${new Date(invoice.period_start * 1000).toLocaleDateString()} - ${new Date(invoice.period_end * 1000).toLocaleDateString()}`,
              userId: user.id,
              stripeInvoiceId: invoice.id,
              stripePaymentUrl: invoice.hosted_invoice_url,
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.activityLog.create({
            data: {
              action: 'failed',
              resource: 'payment',
              details: 'Payment failed for subscription invoice',
              userId: user.id,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const priceId = subscription.items.data[0]?.price?.id;
        const planKey = getPlanKeyFromPriceId(priceId);

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (user && planKey) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: planKey,
              stripeSubscriptionId: subscription.id,
              stripePriceId: priceId,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: 'starter',
              stripeSubscriptionId: null,
              stripePriceId: null,
            },
          });

          await prisma.activityLog.create({
            data: {
              action: 'updated',
              resource: 'plan',
              details: 'Subscription cancelled, downgraded to Starter plan',
              userId: user.id,
            },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
}
