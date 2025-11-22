import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required in .env file');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Webhook endpoint - MUST be before express.json() middleware
app.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).send('Webhook signature or secret missing');
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            console.log('Payment successful:', session.id);
            // TODO: Update user subscription in your database
            break;

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            const subscription = event.data.object as Stripe.Subscription;
            console.log('Subscription updated:', subscription.id);
            // TODO: Update subscription status in your database
            break;

        case 'invoice.payment_failed':
            const invoice = event.data.object as Stripe.Invoice;
            console.log('Payment failed:', invoice.id);
            // TODO: Handle failed payment
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

// Regular JSON middleware for other routes
app.use(express.json());

// Create checkout session for subscription
app.post('/api/create-checkout-session', async (req: Request, res: Response) => {
    try {
        const { priceId, successUrl, cancelUrl } = req.body;

        if (!priceId) {
            return res.status(400).json({ error: 'Price ID is required' });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl || `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/`,
            allow_promotion_codes: true,
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create checkout session'
        });
    }
});

// Create payment intent for one-time payments
app.post('/api/create-payment-intent', async (req: Request, res: Response) => {
    try {
        const { amount, currency = 'usd' } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create payment intent'
        });
    }
});

// Get subscription status
app.get('/api/subscription/:customerId', async (req: Request, res: Response) => {
    try {
        const { customerId } = req.params;

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1,
        });

        if (subscriptions.data.length > 0) {
            const sub = subscriptions.data[0];
            res.json({
                isActive: sub.status === 'active',
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                cancelAtPeriodEnd: sub.cancel_at_period_end,
            });
        } else {
            res.json({ isActive: false });
        }
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch subscription'
        });
    }
});

// Cancel subscription
app.post('/api/cancel-subscription', async (req: Request, res: Response) => {
    try {
        const { subscriptionId } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({ error: 'Subscription ID is required' });
        }

        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });

        res.json({
            success: true,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to cancel subscription'
        });
    }
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
