import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { cartService } from '../services/cart.service';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user!.userId);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
});

router.post('/items', async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addToCart(req.user!.userId, productId, quantity);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
});

router.put('/items/:productId', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await cartService.updateCartItem(req.user!.userId, req.params.productId, quantity);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
});

router.delete('/items/:productId', async (req, res, next) => {
  try {
    const cart = await cartService.removeFromCart(req.user!.userId, req.params.productId);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    await cartService.clearCart(req.user!.userId);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
});

export default router;
