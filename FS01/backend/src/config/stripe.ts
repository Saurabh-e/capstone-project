import Stripe from 'stripe';
import { logger } from '../utils/logger';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

if (!STRIPE_SECRET_KEY) {
  logger.warn('⚠️ Stripe secret key not configured');
}

// Initialize Stripe client
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const stripeUtils = {
  /**
   * Create Stripe Connect account for vendor
   */
  async createConnectAccount(email: string): Promise<string> {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      logger.info(`Created Stripe Connect account: ${account.id}`);
      return account.id;
    } catch (error) {
      logger.error('Stripe account creation error:', error);
      throw new Error('Failed to create Stripe account');
    }
  },

  /**
   * Create account link for onboarding
   */
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<string> {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink.url;
    } catch (error) {
      logger.error('Stripe account link error:', error);
      throw new Error('Failed to create account link');
    }
  },

  /**
   * Create payment intent with vendor splits
   */
  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    vendorSplits: Array<{ accountId: string; amount: number }>;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    const { amount, currency = 'usd', vendorSplits, metadata } = params;

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        payment_method_types: ['card'],
        metadata,
        transfer_data: vendorSplits.length === 1 ? {
          destination: vendorSplits[0].accountId,
          amount: Math.round(vendorSplits[0].amount * 100),
        } : undefined,
      });

      logger.info(`Created payment intent: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Payment intent creation error:', error);
      throw new Error('Failed to create payment intent');
    }
  },

  /**
   * Create transfers for multiple vendors (after charge)
   */
  async createTransfers(
    chargeId: string,
    vendorSplits: Array<{ accountId: string; amount: number }>
  ): Promise<void> {
    try {
      const transferPromises = vendorSplits.map((split) =>
        stripe.transfers.create({
          amount: Math.round(split.amount * 100),
          currency: 'usd',
          destination: split.accountId,
          source_transaction: chargeId,
        })
      );

      await Promise.all(transferPromises);
      logger.info(`Created ${vendorSplits.length} transfers`);
    } catch (error) {
      logger.error('Transfer creation error:', error);
      throw new Error('Failed to create transfers');
    }
  },

  /**
   * Refund payment
   */
  async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      logger.info(`Created refund: ${refund.id}`);
      return refund;
    } catch (error) {
      logger.error('Refund creation error:', error);
      throw new Error('Failed to create refund');
    }
  },

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      logger.error('Webhook verification error:', error);
      throw new Error('Invalid webhook signature');
    }
  },

  /**
   * Get account details
   */
  async getAccount(accountId: string): Promise<Stripe.Account> {
    try {
      return await stripe.accounts.retrieve(accountId);
    } catch (error) {
      logger.error('Account retrieval error:', error);
      throw new Error('Failed to retrieve account');
    }
  },

  /**
   * Calculate platform fee and vendor amount
   */
  calculateSplit(total: number, commissionRate: number): { platformFee: number; vendorAmount: number } {
    const platformFee = (total * commissionRate) / 100;
    const vendorAmount = total - platformFee;

    return {
      platformFee: Math.round(platformFee * 100) / 100,
      vendorAmount: Math.round(vendorAmount * 100) / 100,
    };
  },
};

export default stripe;
