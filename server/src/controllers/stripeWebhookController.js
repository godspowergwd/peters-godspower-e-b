const stripeService = require('../services/stripeService');
const userModel = require('../models/userModel'); // To update user subscription status
const subscriptionPlanModel = require('../models/subscriptionPlanModel'); // To find plan by stripe price ID
// const paymentModel = require('../models/paymentModel'); // Future: to log payments

// POST /api/stripe/webhooks - Stripe webhook handler
const handleStripeWebhook = async (req, res, next) => {
  let event;

  // Stripe requires the raw body to construct the event
  const signature = req.headers['stripe-signature'];
  if (!req.rawBody) {
    console.error('Webhook Error: Raw body is not available. Ensure express.raw middleware is used for this route.');
    return res.status(400).send('Webhook Error: Raw body missing.');
  }

  try {
    event = stripeService.constructWebhookEvent(req.rawBody, signature);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  console.log(`Received Stripe event: ${event.type}`, event.id);
  const dataObject = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      // Payment is successful and the subscription is created.
      // Store the stripe_subscription_id and update user's subscription status.
      const session = dataObject;
      const userId = session.client_reference_id; // We set this to our internal user ID
      const stripeSubscriptionId = session.subscription;
      const stripeCustomerId = session.customer;

      if (session.payment_status === 'paid' && stripeSubscriptionId && userId) {
        console.log(`Checkout session completed for user ${userId}, subscription ${stripeSubscriptionId}`);
        const user = await userModel.findUserById(parseInt(userId, 10));
        if (user) {
          const stripeSubscription = await stripeService.getStripeSubscription(stripeSubscriptionId);
          if (stripeSubscription) {
              const plan = await subscriptionPlanModel.findPlanByStripePriceId(stripeSubscription.items.data[0].price.id);

              userModel._usersInMemoryStore.find(u => u.id === parseInt(userId, 10)).stripe_subscription_id = stripeSubscriptionId;
              userModel._usersInMemoryStore.find(u => u.id === parseInt(userId, 10)).stripe_customer_id = stripeCustomerId; // Ensure this is also set/updated
              userModel._usersInMemoryStore.find(u => u.id === parseInt(userId, 10)).subscription_status = stripeSubscription.status; // e.g., 'active'
              userModel._usersInMemoryStore.find(u => u.id === parseInt(userId, 10)).active_plan_id = plan ? plan.id : null;
              console.log(`User ${userId} subscription status updated to ${stripeSubscription.status} for plan ${plan ? plan.name : 'unknown'}`);
          } else {
              console.error(`Could not retrieve Stripe subscription ${stripeSubscriptionId} after checkout session completion.`);
          }
        } else {
            console.error(`User not found for client_reference_id: ${userId} in checkout.session.completed`);
        }
      } else {
        console.log(`Checkout session completed but payment_status is not 'paid' or subscription/user ID missing. Status: ${session.payment_status}`);
      }
      break;

    case 'invoice.payment_succeeded':
      // Continue to provision the subscription as payments continue to be made.
      // Store payments locally if needed.
      const invoice = dataObject;
      if (invoice.subscription) {
        const subId = invoice.subscription;
        const custId = invoice.customer;
        // Potentially find user by custId if not directly available
        // For now, we assume checkout.session.completed handles initial setup.
        // This event confirms ongoing payments.
        console.log(`Invoice payment succeeded for subscription ${subId}, customer ${custId}.`);
        // Update user's status if it was, e.g., 'past_due'
        const userToUpdate = userModel._usersInMemoryStore.find(u => u.stripe_subscription_id === subId);
        if (userToUpdate && userToUpdate.subscription_status !== 'active') {
            userToUpdate.subscription_status = 'active'; // Or fetch status from Stripe sub object
            console.log(`User ${userToUpdate.id} subscription status reactivated to 'active'.`);
        }
      }
      break;

    case 'invoice.payment_failed':
      // The payment failed or the customer does not have a valid payment method.
      // The subscription becomes past_due. Notify the customer and update user status.
      const failedInvoice = dataObject;
      if (failedInvoice.subscription) {
        const subId = failedInvoice.subscription;
        console.log(`Invoice payment failed for subscription ${subId}. Status: ${failedInvoice.status}, Billing Reason: ${failedInvoice.billing_reason}`);
        const userToUpdate = userModel._usersInMemoryStore.find(u => u.stripe_subscription_id === subId);
        if (userToUpdate) {
            // Stripe automatically sets subscription status to 'past_due' or 'unpaid'
            // Fetch the subscription from Stripe to get the current accurate status
            const stripeSub = await stripeService.getStripeSubscription(subId);
            if (stripeSub) {
                userToUpdate.subscription_status = stripeSub.status;
                console.log(`User ${userToUpdate.id} subscription status updated to ${stripeSub.status} due to payment failure.`);
            }
        }
      }
      break;

    case 'customer.subscription.updated':
        // Occurs for various changes: plan change, cancellation, trial ending, etc.
        const updatedSub = dataObject;
        console.log(`Customer subscription updated: ${updatedSub.id}, Status: ${updatedSub.status}`);
        const userToUpdate = userModel._usersInMemoryStore.find(u => u.stripe_subscription_id === updatedSub.id);
        if (userToUpdate) {
            userToUpdate.subscription_status = updatedSub.status;
            if (updatedSub.status === 'canceled' || updatedSub.cancel_at_period_end) {
                // If fully canceled now, or will cancel at period end
                if (updatedSub.status === 'canceled') userToUpdate.active_plan_id = null;
                console.log(`User ${userToUpdate.id} subscription status updated to ${updatedSub.status}. Cancel at period end: ${updatedSub.cancel_at_period_end}`);
            } else {
                 const plan = await subscriptionPlanModel.findPlanByStripePriceId(updatedSub.items.data[0].price.id);
                 userToUpdate.active_plan_id = plan ? plan.id : userToUpdate.active_plan_id; // Update plan if changed
                 console.log(`User ${userToUpdate.id} subscription status updated to ${updatedSub.status}. Plan: ${plan ? plan.name : 'unknown'}`);
            }
        } else {
            console.warn(`Received customer.subscription.updated for unknown subscription ID: ${updatedSub.id}`);
        }
        break;

    case 'customer.subscription.deleted':
      // Occurs when a subscription is canceled immediately or at period end and the period has ended.
      const deletedSub = dataObject;
      console.log(`Customer subscription deleted: ${deletedSub.id}, Status: ${deletedSub.status}`); // status usually 'canceled'
      const userOnDeletedSub = userModel._usersInMemoryStore.find(u => u.stripe_subscription_id === deletedSub.id);
      if (userOnDeletedSub) {
        userOnDeletedSub.subscription_status = 'canceled'; // Ensure it's marked as canceled
        userOnDeletedSub.active_plan_id = null;
        // userOnDeletedSub.stripe_subscription_id = null; // Optionally clear this
        console.log(`User ${userOnDeletedSub.id} subscription fully canceled and status updated.`);
      }
      break;

    // ... handle other event types as needed:
    // - customer.subscription.trial_will_end
    // - payment_intent.succeeded, payment_intent.payment_failed
    // - setup_intent.succeeded (for saving payment methods)

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
};

module.exports = {
  handleStripeWebhook,
};
