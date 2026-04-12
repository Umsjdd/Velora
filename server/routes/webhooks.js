import { isProviderConfigured } from '../providers/utils.js';
import mollieProvider from '../providers/mollie.js';
import { PLAN_LIMITS, MOLLIE_PLAN_AMOUNTS } from '../config/plans.js';

export async function handleMollieWebhook(req, res) {
  if (!isProviderConfigured('mollie')) {
    return res.status(400).json({ error: 'Mollie not configured' });
  }

  const paymentId = req.body.id;
  if (!paymentId) {
    return res.status(400).json({ error: 'Missing payment id' });
  }

  const prisma = req.prisma;

  try {
    const payment = await mollieProvider.getPayment(paymentId);
    const metadata = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata || {};
    const { plan: planKey, userId } = metadata;

    if (payment.status === 'paid') {
      if (userId && planKey) {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (user) {
          // Update user plan
          const updateData = { plan: planKey };

          // If this was a first payment, create a subscription now that we have a mandate
          if (payment.sequenceType === 'first' && user.mollieCustomerId) {
            try {
              const webhookUrl = payment.webhookUrl;
              const subscription = await mollieProvider.createSubscription(user.mollieCustomerId, {
                amount: MOLLIE_PLAN_AMOUNTS[planKey],
                description: `Vestora ${PLAN_LIMITS[planKey]?.name || planKey} Plan`,
                webhookUrl,
                metadata: { plan: planKey, userId },
              });
              updateData.mollieSubscriptionId = subscription.id;
            } catch (subErr) {
              console.error('Failed to create subscription after first payment:', subErr);
            }
          }

          await prisma.user.update({ where: { id: userId }, data: updateData });

          // Create invoice record
          await prisma.invoice.create({
            data: {
              amount: parseFloat(payment.amount.value),
              status: 'paid',
              period: new Date().toLocaleDateString(),
              userId: user.id,
              molliePaymentId: payment.id,
            },
          });

          await prisma.activityLog.create({
            data: {
              action: 'updated',
              resource: 'plan',
              details: `Subscribed to "${PLAN_LIMITS[planKey]?.name || planKey}" plan via Mollie`,
              userId: user.id,
            },
          });
        }
      }
    } else if (payment.status === 'failed' || payment.status === 'expired') {
      if (userId) {
        await prisma.activityLog.create({
          data: {
            action: 'failed',
            resource: 'payment',
            details: `Payment ${payment.status} for subscription`,
            userId,
          },
        });
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
}
