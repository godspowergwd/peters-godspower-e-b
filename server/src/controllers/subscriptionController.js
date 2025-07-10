const subscriptionPlanModel = require('../models/subscriptionPlanModel');
const userModel = require('../models/userModel'); // To update user with Stripe IDs
const stripeService = require('../services/stripeService');

// GET /api/subscriptions/plans - List available subscription plans
const listAvailablePlans = async (req, res, next) => {
  try {
    const plans = await subscriptionPlanModel.getActiveSubscriptionPlans();
    // Sanitize plans if needed (e.g., remove stripe_price_ids if not needed by client directly for listing)
    // For now, sending them as client might use them to show prices or features.
    res.status(200).json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    next(error);
  }
};

// POST /api/subscriptions/create-checkout-session - Create a Stripe Checkout session for a plan
const createCheckoutSession = async (req, res, next) => {
  try {
    const { planId } = req.body; // This is our internal plan ID (e.g., 'plan_pro_monthly')
    const userId = req.user.id;

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required.' });
    }

    const plan = await subscriptionPlanModel.findPlanById(planId);
    if (!plan || !plan.is_active) {
      return res.status(404).json({ message: 'Active plan not found.' });
    }

    // Determine which Stripe Price ID to use (monthly or annual)
    // This simple example assumes client sends planId like 'plan_pro_monthly' or 'plan_pro_annually'
    // and the model has the correct corresponding stripe_price_id.
    let stripePriceId;
    if (plan.type === 'monthly' && plan.stripe_price_id_monthly) {
        stripePriceId = plan.stripe_price_id_monthly;
    } else if (plan.type === 'annually' && plan.stripe_price_id_annually) {
        stripePriceId = plan.stripe_price_id_annually;
    } else {
        // Fallback or if plan structure is different, e.g. a plan object has one price_id based on selection
        stripePriceId = plan.stripe_price_id_monthly || plan.stripe_price_id_annually;
    }

    if (!stripePriceId) {
        console.error(`No Stripe Price ID found for plan ${planId} (type: ${plan.type})`);
        return res.status(500).json({ message: 'Configuration error: Stripe Price ID missing for this plan.' });
    }
    if (stripePriceId.startsWith('price_xxxxxxxxxxxxxx')) {
        console.warn(`Using placeholder Stripe Price ID: ${stripePriceId}. Replace with actual ID.`);
        // For non-test environments, you might want to block this
        // if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
        //    return res.status(500).json({ message: 'Stripe integration is not fully configured (placeholder Price ID).' });
        // }
    }


    let user = await userModel.findUserById(userId); // Get current user data
    if (!user) {
      return res.status(404).json({ message: 'User not found.' }); // Should not happen if authenticated
    }

    let stripeCustomerId = user.stripe_customer_id;
    if (!stripeCustomerId) {
      // Create Stripe customer if they don't have one yet
      const stripeCustomer = await stripeService.createStripeCustomer({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        // id: user.id // Pass your internal user ID for metadata if desired
      });
      if (!stripeCustomer) {
        return res.status(500).json({ message: 'Failed to create Stripe customer.' });
      }
      stripeCustomerId = stripeCustomer.id;
      // Update user model with Stripe Customer ID
      // In a real DB, this would be an update query. For in-memory:
      userModel._usersInMemoryStore.find(u => u.id === userId).stripe_customer_id = stripeCustomerId;
    }

    const session = await stripeService.createSubscriptionCheckoutSession(
      stripeCustomerId,
      stripePriceId,
      userId // client_reference_id
    );

    if (!session || !session.id) {
      return res.status(500).json({ message: 'Failed to create Stripe Checkout session.' });
    }

    // Return the Checkout Session ID. Frontend will use this to redirect to Stripe.
    res.status(200).json({ sessionId: session.id, checkoutUrl: session.url });

  } catch (error) {
    console.error('Error creating Stripe Checkout session:', error);
    // Handle specific Stripe errors if necessary
    if (error.type && error.type.startsWith('Stripe')) {
        return res.status(error.statusCode || 500).json({ message: error.message, type: error.type });
    }
    next(error);
  }
};

// GET /api/subscriptions/my-subscription - Get current user's subscription details
const getCurrentUserSubscription = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findUserById(userId);

        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (!user.stripe_subscription_id || user.subscription_status === 'inactive') {
            return res.status(200).json({ message: 'No active subscription found.', subscription: null });
        }

        // Fetch latest subscription details from Stripe to ensure data is current
        const stripeSubscription = await stripeService.getStripeSubscription(user.stripe_subscription_id);
        if (!stripeSubscription) {
            // This might indicate an issue, e.g., subscription deleted directly in Stripe
            // Update our local records
            userModel._usersInMemoryStore.find(u => u.id === userId).subscription_status = 'inactive';
            userModel._usersInMemoryStore.find(u => u.id === userId).active_plan_id = null;
            return res.status(200).json({ message: 'No active subscription found (Stripe data missing).', subscription: null });
        }

        const plan = await subscriptionPlanModel.findPlanByStripePriceId(stripeSubscription.items.data[0].price.id);

        const currentSubscriptionDetails = {
            stripeSubscriptionId: user.stripe_subscription_id,
            status: stripeSubscription.status, // Use Stripe's status as source of truth
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            plan: plan ? { id: plan.id, name: plan.name, type: plan.type } : { id: null, name: 'Unknown Plan' },
            // Add more details as needed, e.g., price
        };

        // Update local user status if Stripe's status differs and is more current
        if (user.subscription_status !== stripeSubscription.status) {
            userModel._usersInMemoryStore.find(u => u.id === userId).subscription_status = stripeSubscription.status;
        }
        if (plan && user.active_plan_id !== plan.id) {
             userModel._usersInMemoryStore.find(u => u.id === userId).active_plan_id = plan.id;
        }


        res.status(200).json(currentSubscriptionDetails);

    } catch (error) {
        console.error('Error fetching user subscription:', error);
        next(error);
    }
};

// POST /api/subscriptions/cancel - Cancel user's active subscription
const cancelSubscription = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findUserById(userId);

        if (!user || !user.stripe_subscription_id || user.subscription_status === 'inactive' || user.subscription_status === 'canceled') {
            return res.status(400).json({ message: 'No active subscription to cancel or already canceled.' });
        }

        // Default to cancel_at_period_end = true
        const updatedStripeSubscription = await stripeService.cancelStripeSubscription(user.stripe_subscription_id, true);

        if (!updatedStripeSubscription) {
            return res.status(500).json({ message: 'Failed to process subscription cancellation with Stripe.' });
        }

        // Update local user record
        userModel._usersInMemoryStore.find(u => u.id === userId).subscription_status = updatedStripeSubscription.status; // Should be 'active' but with cancel_at_period_end=true
        // userModel._usersInMemoryStore.find(u => u.id === userId).active_plan_id = null; // Or keep until period end

        res.status(200).json({
            message: 'Subscription cancellation initiated. It will be fully canceled at the end of the current billing period.',
            subscriptionStatus: updatedStripeSubscription.status,
            cancelAtPeriodEnd: updatedStripeSubscription.cancel_at_period_end
        });

    } catch (error) {
        console.error('Error canceling subscription:', error);
        next(error);
    }
};


module.exports = {
  listAvailablePlans,
  createCheckoutSession,
  getCurrentUserSubscription,
  cancelSubscription,
};
