import { createMollieClient } from '@mollie/api-client';

let _mollie = null;

function getMollie() {
  if (!_mollie) {
    _mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
  }
  return _mollie;
}

export async function createCustomer(email, name) {
  const mollie = getMollie();
  return mollie.customers.create({ name, email, metadata: JSON.stringify({ platform: 'vestora' }) });
}

export async function createPayment({ customerId, amount, description, redirectUrl, webhookUrl, metadata = {} }) {
  const mollie = getMollie();
  return mollie.payments.create({
    amount: { currency: 'EUR', value: parseFloat(amount).toFixed(2) },
    description,
    customerId,
    sequenceType: 'first',
    redirectUrl,
    webhookUrl,
    metadata: JSON.stringify(metadata),
  });
}

export async function createSubscription(customerId, { amount, description, interval = '1 month', webhookUrl, metadata = {} }) {
  const mollie = getMollie();
  return mollie.customerSubscriptions.create({
    customerId,
    amount: { currency: 'EUR', value: parseFloat(amount).toFixed(2) },
    interval,
    description,
    webhookUrl,
    metadata: JSON.stringify(metadata),
  });
}

export async function getPayment(paymentId) {
  const mollie = getMollie();
  return mollie.payments.get(paymentId);
}

export async function getSubscription(customerId, subscriptionId) {
  const mollie = getMollie();
  return mollie.customerSubscriptions.get(subscriptionId, { customerId });
}

export async function cancelSubscription(customerId, subscriptionId) {
  const mollie = getMollie();
  return mollie.customerSubscriptions.cancel(subscriptionId, { customerId });
}

export async function listPayments(customerId) {
  const mollie = getMollie();
  return mollie.customerPayments.list({ customerId });
}

export default {
  createCustomer,
  createPayment,
  createSubscription,
  getPayment,
  getSubscription,
  cancelSubscription,
  listPayments,
};
