// In-memory store for Subscription Plans
// IMPORTANT: NOT FOR PRODUCTION. In a real app, this data would come from a database
// and correspond to Products & Prices configured in your Stripe Dashboard.

const plansInMemoryStore = [
  {
    id: 'plan_basic_monthly', // Your internal plan identifier
    name: 'Basic Plan (Monthly)',
    description: 'Access to core features, billed monthly.',
    price_monthly: 1000, // Price in cents (e.g., $10.00)
    price_annually: null, // No annual option for this example of basic
    currency: 'usd',
    stripe_price_id_monthly: 'price_xxxxxxxxxxxxxx_basic_monthly', // REPLACE with your actual Stripe Price ID for monthly basic
    stripe_price_id_annually: null,
    features: [
      'Up to 5 Landing Pages',
      'Basic Email Automation (1 sequence)',
      '1 Social Media Account',
      'Core Analytics',
    ],
    is_active: true,
    type: 'monthly', // Helper to distinguish
  },
  {
    id: 'plan_pro_monthly',
    name: 'Pro Plan (Monthly)',
    description: 'Advanced features and higher limits, billed monthly.',
    price_monthly: 2500, // Price in cents (e.g., $25.00)
    price_annually: 25000, // Price in cents (e.g., $250.00 annually - $20.83/mo)
    currency: 'usd',
    stripe_price_id_monthly: 'price_xxxxxxxxxxxxxx_pro_monthly', // REPLACE with your actual Stripe Price ID for monthly pro
    stripe_price_id_annually: 'price_xxxxxxxxxxxxxx_pro_annually', // REPLACE with your actual Stripe Price ID for annual pro
    features: [
      'Up to 20 Landing Pages',
      'Advanced Email Automation (5 sequences)',
      '5 Social Media Accounts',
      'Detailed Analytics Dashboard',
      'Priority Support',
    ],
    is_active: true,
    type: 'monthly',
  },
  {
    id: 'plan_pro_annually', // Separate internal ID for the annual version of Pro
    name: 'Pro Plan (Annually)',
    description: 'Advanced features and higher limits, billed annually (save ~17%).',
    price_monthly: null, // Not directly applicable, but could store effective monthly price
    price_annually: 25000, // Price in cents (e.g., $250.00)
    currency: 'usd',
    stripe_price_id_monthly: null, // This plan variant is annual
    stripe_price_id_annually: 'price_xxxxxxxxxxxxxx_pro_annually', // SAME Stripe Price ID as above for annual pro
    features: [
      'Up to 20 Landing Pages',
      'Advanced Email Automation (5 sequences)',
      '5 Social Media Accounts',
      'Detailed Analytics Dashboard',
      'Priority Support',
    ],
    is_active: true,
    type: 'annually',
  },
  // Add more plans as needed (e.g., a free tier with no Stripe Price ID, or an enterprise plan)
];

/**
 * Retrieves all active subscription plans.
 * @returns {Promise<object[]>} - An array of active plan objects.
 */
const getActiveSubscriptionPlans = async () => {
  return plansInMemoryStore.filter(plan => plan.is_active).map(p => ({ ...p }));
};

/**
 * Finds a subscription plan by its internal ID.
 * @param {string} planId - The internal ID of the plan.
 * @returns {Promise<object|null>} - The plan object or null if not found.
 */
const findPlanById = async (planId) => {
  const plan = plansInMemoryStore.find(p => p.id === planId);
  return plan ? { ...plan } : null;
};

/**
 * Finds a subscription plan by a Stripe Price ID.
 * Useful for webhook handling to identify which internal plan a Stripe event refers to.
 * @param {string} stripePriceId - The Stripe Price ID.
 * @returns {Promise<object|null>} - The plan object or null if not found.
 */
const findPlanByStripePriceId = async (stripePriceId) => {
    const plan = plansInMemoryStore.find(p => p.stripe_price_id_monthly === stripePriceId || p.stripe_price_id_annually === stripePriceId);
    return plan ? { ...plan } : null;
};


module.exports = {
  getActiveSubscriptionPlans,
  findPlanById,
  findPlanByStripePriceId,
  // _plansInMemoryStore: plansInMemoryStore // For testing if needed
};

// IMPORTANT:
// Before this can work, you MUST:
// 1. Create corresponding Products in your Stripe Dashboard (e.g., "Basic Plan", "Pro Plan").
// 2. For each Product, create one or more Prices (e.g., a monthly price, an annual price).
// 3. Replace the placeholder `price_xxxxxxxxxxxxxx...` IDs above with your ACTUAL Stripe Price IDs.
//    - `stripe_price_id_monthly` for monthly billing.
//    - `stripe_price_id_annually` for annual billing.
//    A single plan (like "Pro") can have both monthly and annual Stripe Price IDs.
//    The `id` field here is your app's internal identifier for plan variations.
