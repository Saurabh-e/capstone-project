import { cacheUtil } from '../config/redis';
import { prisma } from '../index';
import { AppError } from '../middleware/errorHandler';

interface CartItem {
  productId: string;
  vendorId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

const CART_TTL = 7 * 24 * 60 * 60; // 7 days

export const cartService = {
  /**
   * Get user's cart
   */
  async getCart(userId: string): Promise<Cart> {
    const cartKey = `cart:${userId}`;
    const cart = await cacheUtil.get(cartKey);

    if (!cart) {
      return {
        items: [],
        subtotal: 0,
        itemCount: 0,
      };
    }

    return cart;
  },

  /**
   * Add item to cart
   */
  async addToCart(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<Cart> {
    if (quantity < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.inventory < quantity) {
      throw new AppError('Insufficient inventory', 400);
    }

    // Get cart
    const cartKey = `cart:${userId}`;
    let cart = await cacheUtil.get(cartKey);

    if (!cart) {
      cart = {
        items: [],
        subtotal: 0,
        itemCount: 0,
      };
    }

    // Find existing item
    const existingItem = cart.items.find(
      (item: CartItem) => item.productId === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        vendorId: product.vendorId,
        name: product.name,
        price: parseFloat(product.price.toString()),
        quantity,
        image: product.images[0] || '',
      });
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );
    cart.itemCount = cart.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

    // Save cart
    await cacheUtil.set(cartKey, cart, CART_TTL);

    return cart;
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    if (quantity < 0) {
      throw new AppError('Invalid quantity', 400);
    }

    const cartKey = `cart:${userId}`;
    let cart = await cacheUtil.get(cartKey);

    if (!cart) {
      throw new AppError('Cart is empty', 400);
    }

    const item = cart.items.find((item: CartItem) => item.productId === productId);

    if (!item) {
      throw new AppError('Product not in cart', 404);
    }

    if (quantity === 0) {
      cart.items = cart.items.filter((item: CartItem) => item.productId !== productId);
    } else {
      item.quantity = quantity;
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );
    cart.itemCount = cart.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

    // Save cart
    await cacheUtil.set(cartKey, cart, CART_TTL);

    return cart;
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cartKey = `cart:${userId}`;
    let cart = await cacheUtil.get(cartKey);

    if (!cart) {
      throw new AppError('Cart is empty', 400);
    }

    cart.items = cart.items.filter((item: CartItem) => item.productId !== productId);

    // Recalculate totals
    cart.subtotal = cart.items.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );
    cart.itemCount = cart.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

    if (cart.items.length === 0) {
      await cacheUtil.del(cartKey);
    } else {
      await cacheUtil.set(cartKey, cart, CART_TTL);
    }

    return cart;
  },

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<void> {
    const cartKey = `cart:${userId}`;
    await cacheUtil.del(cartKey);
  },

  /**
   * Validate cart items (check inventory)
   */
  async validateCart(userId: string): Promise<{ valid: boolean; errors: string[] }> {
    const cartKey = `cart:${userId}`;
    const cart = await cacheUtil.get(cartKey);
    const errors: string[] = [];

    if (!cart || cart.items.length === 0) {
      return { valid: false, errors: ['Cart is empty'] };
    }

    for (const item of cart.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        errors.push(`Product ${item.name} no longer exists`);
      } else if (product.inventory < item.quantity) {
        errors.push(`${item.name} has insufficient inventory`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
