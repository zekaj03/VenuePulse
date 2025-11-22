// Stripe configuration
// In production, use environment variables for the publishable key
export const STRIPE_CONFIG = {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
};

// Stripe Premium Price ID
export const STRIPE_PREMIUM_PRICE_ID = import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || 'price_your_premium_price_id_here';
