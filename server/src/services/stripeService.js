require('dotenv').config();
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL;
const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL;


if (!STRIPE_SECRET_KEY) {
  console.error('FATAL ERROR: STRIPE_SECRET_KEY is not defined. Stripe services will not work.');
  // In a real app, you might want to throw an error or prevent the app from starting
}
if (!STRIPE_WEBHOOK_SECRET && process.env.NODE_ENV !== 'test') {
    console.warn('WARNING: STRIPE_WEBHOOK_SECRET is not defined. Webhook verification will fail.');
}
if (!STRIPE_SUCCESS_URL || !STRIPE_CANCEL_URL) {
    console.warn('WARNING: STRIPE_SUCCESS_URL or STRIPE_CANCEL_URL is not defined. Stripe Checkout redirection might fail.');
}


const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use a recent, fixed API version
  // Optionally, add telemetry: false if you want to disable it
  // appInfo: { // Optional: identify your app to Stripe
  //   name: "AI Marketing App",
  //   version: "0.0.1",
  //   url: "https://example.com"
  // }
}) : null;

/**
 * Creates a new Stripe Customer.
 * @param {object} userData - User data, typically from userModel.
 * @param {string} userData.email - User's email.
 * @param {string} [userData.first_name] - User's first name.
 * @param {string} [userData.last_name] - User's last name.
 * @returns {Promise<Stripe.Customer|null>} Stripe Customer object or null on error.
 */
const createStripeCustomer = async (userData) => {
  if (!stripe) return null;
  try {
    const customer = await stripe.customers.create({
      email: userData.email,
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      // You can add metadata like your internal user ID:
      // metadata: { app_user_id: userData.id.toString() }
    });
    console.log(`Stripe customer created: ${customer.id} for email ${userData.email}`);
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error; // Re-throw for controller to handle
  }
};

/**
 * Creates a Stripe Checkout Session for a subscription.
 * @param {string} stripeCustomerId - The Stripe Customer ID.
 * @param {string} stripePriceId - The Stripe Price ID for the subscription plan.
 * @param {string} clientReferenceId - Your internal reference (e.g., user ID) to track the session.
 * @returns {Promise<Stripe.Checkout.Session|null>} Stripe Checkout Session object or null on error.
 */
const createSubscriptionCheckoutSession = async (stripeCustomerId, stripePriceId, clientReferenceId) => {
  if (!stripe || !STRIPE_SUCCESS_URL || !STRIPE_CANCEL_URL) return null;
  try {
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: STRIPE_SUCCESS_URL, // Let Stripe append session_id: STRIPE_SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: STRIPE_CANCEL_URL,
      client_reference_id: clientReferenceId.toString(), // Your internal ID (e.g., user ID)
      // automatic_tax: { enabled: true }, // If you have Stripe Tax configured
      // subscription_data: { // Optional: set trial period, etc.
      //   trial_period_days: 7,
      //   metadata: { app_user_id: clientReferenceId.toString() }
      // },
      // metadata: { // Metadata for the checkout session itself
      //   app_user_id: clientReferenceId.toString()
      // }
    });
    return session;
  } catch (error) {
    console.error('Error creating Stripe Checkout session:', error);
    throw error;
  }
};

/**
 * Constructs a Stripe webhook event from the raw request.
 * IMPORTANT: Requires raw request body for signature verification.
 * @param {Buffer} rawBody - The raw request body from Express.
 * @param {string} signature - The 'stripe-signature' header.
 * @returns {Stripe.Event|null} Stripe Event object or throws error if verification fails.
 */
const constructWebhookEvent = (rawBody, signature) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      console.error('Stripe SDK or Webhook Secret not configured for webhook event construction.');
      throw new Error('Webhook processing is not configured.');
  }
  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
    return event;
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed: ${err.message}`);
    throw new Error(`Webhook signature verification failed: ${err.message}`); // Critical for security
  }
};

/**
 * Retrieves a Stripe Subscription object.
 * @param {string} stripeSubscriptionId - The ID of the Stripe subscription.
 * @returns {Promise<Stripe.Subscription|null>}
 */
const getStripeSubscription = async (stripeSubscriptionId) => {
    if (!stripe) return null;
    try {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        return subscription;
    } catch (error) {
        console.error(`Error retrieving Stripe subscription ${stripeSubscriptionId}:`, error);
        throw error;
    }
};

/**
 * Cancels a Stripe Subscription.
 * @param {string} stripeSubscriptionId - The ID of the Stripe subscription to cancel.
 * @param {boolean} [atPeriodEnd=true] - If true, cancels at period end. If false, cancels immediately.
 * @returns {Promise<Stripe.Subscription|null>} The updated Stripe Subscription object.
 */
const cancelStripeSubscription = async (stripeSubscriptionId, atPeriodEnd = true) => {
    if (!stripe) return null;
    try {
        let subscription;
        if (atPeriodEnd) {
            subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
                cancel_at_period_end: true,
            });
        } else {
            // Immediate cancellation
            subscription = await stripe.subscriptions.cancel(stripeSubscriptionId);
        }
        console.log(`Stripe subscription ${stripeSubscriptionId} scheduled for cancellation (at_period_end: ${atPeriodEnd}): ${subscription.status}`);
        return subscription;
    } catch (error) {
        console.error(`Error canceling Stripe subscription ${stripeSubscriptionId}:`, error);
        throw error;
    }
};

// TODO: Add functions for other Stripe interactions as needed:
// - updateSubscription (e.g., change plan)
// - listPaymentMethods for a customer
// - createBillingPortalSession for customer self-service

module.exports = {
  stripe, // Export the initialized stripe object if needed elsewhere (use with caution)
  createStripeCustomer,
  createSubscriptionCheckoutSession,
  constructWebhookEvent,
  getStripeSubscription,
  cancelStripeSubscription,
};
