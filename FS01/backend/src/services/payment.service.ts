import { PrismaClient, PaymentStatus, OrderStatus } from '@prisma/client';
import { stripeUtils } from '../config/stripe';
import { orderService } from './order.service';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const paymentService = {
  /**
   * Create payment intent
   */
  async createPaymentIntent(orderId: string, userId: string): Promise<any> {
    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            vendor: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.SUCCEEDED) {
      throw new AppError('Payment already processed', 400);
    }

    // Calculate vendor splits
    const vendorSplits = order.items.reduce((acc: any[], item: any) => {
      const { platformFee, vendorAmount } = stripeUtils.calculateSplit(
        item.total,
        item.vendor.commissionRate
      );

      const existing = acc.find((s) => s.accountId === item.vendor.stripeAccountId);
      if (existing) {
        existing.amount += vendorAmount;
      } else {
        acc.push({
          accountId: item.vendor.stripeAccountId,
          amount: vendorAmount,
          vendorId: item.vendorId,
        });
      }

      return acc;
    }, []);

    // Create Stripe payment intent
    const paymentIntent = await stripeUtils.createPaymentIntent({
      amount: order.total,
      vendorSplits,
      metadata: {
        orderId,
        userId,
      },
    });

    // Save payment
    const payment = await prisma.payment.create({
      data: {
        orderId,
        stripePaymentId: paymentIntent.id,
        amount: order.total,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        vendorSplits: JSON.stringify(vendorSplits),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
      amount: order.total,
    };
  },

  /**
   * Confirm payment
   */
  async confirmPayment(paymentIntentId: string, orderId: string): Promise<void> {
    // Update payment status
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntentId },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Update order status
    await orderService.updateOrderStatus(orderId, OrderStatus.PAID);

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SUCCEEDED },
    });

    logger.info(`Payment confirmed for order ${orderId}`);
  },

  /**
   * Handle webhook
   */
  async handleWebhook(event: any): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await paymentService.handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await paymentService.handlePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await paymentService.handleRefund(event.data.object);
        break;
    }
  },

  /**
   * Handle payment succeeded
   */
  async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;

    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (!payment) {
      logger.warn(`Payment not found for intent ${paymentIntent.id}`);
      return;
    }

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SUCCEEDED },
    });

    // Update order
    await orderService.updateOrderStatus(orderId, OrderStatus.PAID);

    logger.info(`Payment succeeded for order ${orderId}`);
  },

  /**
   * Handle payment failed
   */
  async handlePaymentFailed(paymentIntent: any): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (!payment) {
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });

    logger.error(`Payment failed for order ${payment.orderId}`);
  },

  /**
   * Handle refund
   */
  async handleRefund(charge: any): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: charge.payment_intent },
    });

    if (!payment) {
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED },
    });

    // Cancel order
    await orderService.updateOrderStatus(payment.orderId, OrderStatus.REFUNDED);

    logger.info(`Refund processed for order ${payment.orderId}`);
  },

  /**
   * Get payment
   */
  async getPayment(paymentId: string) {
    return await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
      },
    });
  },
};
