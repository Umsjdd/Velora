import Stripe from 'stripe';

let _stripe = null;

function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export async function createCustomer(email, name) {
  const stripe = getStripe();
  return stripe.customers.create({ email, name, metadata: { platform: 'vestora' } });
}

export async function createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

export async function createPortalSession(customerId, returnUrl) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function getSubscription(subscriptionId) {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function updateSubscription(subscriptionId, priceId) {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: priceId,
    }],
    proration_behavior: 'create_prorations',
  });
}

export async function cancelSubscription(subscriptionId) {
  const stripe = getStripe();
  return stripe.subscriptions.cancel(subscriptionId);
}

export function constructWebhookEvent(body, signature) {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

export async function getInvoices(customerId, limit = 20) {
  const stripe = getStripe();
  return stripe.invoices.list({ customer: customerId, limit });
}

export default {
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  constructWebhookEvent,
  getInvoices,
};
