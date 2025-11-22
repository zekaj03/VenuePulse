import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG, STRIPE_PREMIUM_PRICE_ID } from '../stripe.config';

interface StripeCheckoutProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
    onCancel?: () => void;
}

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
    onSuccess,
    onError,
    onCancel,
}) => {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async (paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'paypal') => {
        setLoading(true);

        try {
            const stripe = await stripePromise;

            if (!stripe) {
                throw new Error('Stripe failed to load');
            }

            // Create checkout session
            const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: STRIPE_PREMIUM_PRICE_ID,
                    successUrl: `${window.location.origin}/?payment=success`,
                    cancelUrl: `${window.location.origin}/?payment=cancel`,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create checkout session');
            }

            const { sessionId } = await response.json();

            // Redirect to Stripe Checkout
            const result = await stripe.redirectToCheckout({
                sessionId,
            });

            if (result.error) {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Payment failed';
            onError?.(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <button
                onClick={() => handleCheckout('card')}
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-lg p-4 flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>{loading ? 'Processing...' : 'Pay with Card'}</span>
            </button>

            {/* Apple Pay */}
            <button
                onClick={() => handleCheckout('apple_pay')}
                disabled={loading}
                className="w-full bg-black text-white rounded-lg p-4 flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>Apple Pay</span>
            </button>

            {/* Google Pay */}
            <button
                onClick={() => handleCheckout('google_pay')}
                disabled={loading}
                className="w-full bg-white text-gray-800 border-2 border-gray-300 rounded-lg p-4 flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
                <span>Google Pay</span>
            </button>

            {/* PayPal */}
            <button
                onClick={() => handleCheckout('paypal')}
                disabled={loading}
                className="w-full bg-yellow-400 text-blue-900 rounded-lg p-4 flex items-center justify-center gap-2 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527-.338 2.145a.525.525 0 0 0 .518.611h3.671a.867.867 0 0 0 .858-.738l.035-.177.671-4.262.043-.23a.87.87 0 0 1 .858-.739h.539c3.72 0 6.627-1.512 7.477-5.884.354-1.832.166-3.361-.698-4.426z"/>
                </svg>
                <span>PayPal</span>
            </button>

            {onCancel && (
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="w-full text-gray-600 hover:text-gray-800 p-2 transition-colors"
                >
                    Cancel
                </button>
            )}
        </div>
    );
};
