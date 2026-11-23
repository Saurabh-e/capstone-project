import { Router, raw } from 'express';
import { authenticate } from '../middleware/auth';
import { paymentService } from '../services/payment.service';
import { stripe } from '../config/stripe';

const router = Router();

// Webhook endpoint (before JSON parser)
router.post(
  '/webhook',
  raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
      
      await paymentService.handleWebhook(event);
      res.json({ success: true });\n    } catch (error) {\n      next(error);\n    }\n  }\n);\n\n// Protected routes\nrouter.use(authenticate);\n\nrouter.post('/intent', async (req, res, next) => {\n  try {\n    const { orderId } = req.body;\n    const result = await paymentService.createPaymentIntent(orderId, req.user!.userId);\n    res.json({ success: true, data: result });\n  } catch (error) {\n    next(error);\n  }\n});\n\nrouter.post('/confirm', async (req, res, next) => {\n  try {\n    const { paymentIntentId, orderId } = req.body;\n    await paymentService.confirmPayment(paymentIntentId, orderId);\n    res.json({ success: true, message: 'Payment confirmed' });\n  } catch (error) {\n    next(error);\n  }\n});\n\nexport default router;
