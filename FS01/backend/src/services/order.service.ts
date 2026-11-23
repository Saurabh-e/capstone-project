import { PrismaClient, OrderStatus, OrderItemStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { cartService } from './cart.service';
import { couponService } from './coupon.service';
import { productService } from './product.service';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const orderService = {
  /**
   * Create order from cart
   */
  async createOrder(
    userId: string,
    data: {
      shippingAddress: {
        fullName: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
      billingAddress?: {
        fullName: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
      couponCode?: string;
      notes?: string;
    }
  ): Promise<any> {
    // Validate cart
    const cartValidation = await cartService.validateCart(userId);
    if (!cartValidation.valid) {
      throw new AppError(cartValidation.errors.join(', '), 400);
    }

    // Get cart
    const cart = await cartService.getCart(userId);

    if (cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    // Calculate totals
    let subtotal = cart.subtotal;
    let discount = 0;
    let orderedCoupons: any[] = [];

    // Apply coupon if provided
    if (data.couponCode) {
      const couponValidation = await couponService.validateCoupon(
        data.couponCode,
        userId,
        subtotal
      );

      if (!couponValidation.valid) {
        throw new AppError(couponValidation.error, 400);
      }

      discount = couponValidation.discount;
      orderedCoupons.push({
        couponId: couponValidation.coupon.id,
        discountApplied: discount,
      });
    }

    const total = Math.max(0, subtotal - discount);

    // Group items by vendor
    const itemsByVendor = cart.items.reduce((acc: any, item: any) => {
      if (!acc[item.vendorId]) {
        acc[item.vendorId] = [];
      }
      acc[item.vendorId].push(item);
      return acc;
    }, {});

    // Create order
    const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 8)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: OrderStatus.PLACED,
        subtotal,
        discount,
        tax: 0, // Can be calculated based on shipping address
        shipping: 0, // Can be calculated based on shipping address
        total,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress || data.shippingAddress,
        notes: data.notes,
        items: {
          createMany: {
            data: cart.items.map((item: any) => ({
              productId: item.productId,
              vendorId: item.vendorId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity,
              status: OrderItemStatus.PENDING,
            })),
          },
        },
        ...(orderedCoupons.length > 0 && {
          orderCoupons: {
            createMany: {
              data: orderedCoupons,
            },
          },
        }),
      },
      include: {
        items: true,
        orderCoupons: true,
      },
    });

    // Update coupon usage
    if (data.couponCode) {
      await couponService.incrementUsage(data.couponCode, userId);
    }

    // Update product inventory
    for (const item of cart.items) {
      await productService.updateInventory(item.productId, item.quantity);
    }

    // Clear cart
    await cartService.clearCart(userId);

    return order;
  },

  /**
   * Get user orders
   */
  async getUserOrders(
    userId: string,
    params: {
      status?: OrderStatus;
      page?: number;
      limit?: number;
    }
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          userId,
          ...(params.status && { status: params.status }),
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  images: true,
                },
              },
            },
          },
          payment: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({
        where: {
          userId,
          ...(params.status && { status: params.status }),
        },
      }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get order details
   */
  async getOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                images: true,
              },
            },
            vendor: {
              select: {
                businessName: true,
                rating: true,
              },
            },
          },
        },
        payment: true,
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
        orderCoupons: {
          include: {
            coupon: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new AppError('Order not found', 404);
    }

    return order;
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<any> {
    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PLACED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.REFUNDED],
      [OrderStatus.PROCESSING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
      [OrderStatus.PACKED]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!validTransitions[order.status as OrderStatus].includes(status)) {
      throw new AppError(`Cannot transition from ${order.status} to ${status}`, 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === OrderStatus.SHIPPED && { shippedAt: new Date() }),
        ...(status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
        ...(status === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
      },
    });

    return updatedOrder;
  },

  /**
   * Update order item status
   */
  async updateOrderItemStatus(
    orderId: string,
    itemId: string,
    status: OrderItemStatus,
    trackingNumber?: string
  ): Promise<any> {
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.orderId !== orderId) {
      throw new AppError('Order item not found', 404);
    }

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status,
      },
    });

    // If all items are delivered, mark order as delivered
    const allItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    if (allItems.every((i) => i.status === OrderItemStatus.DELIVERED)) {
      await orderService.updateOrderStatus(orderId, OrderStatus.DELIVERED);
    }

    return updated;
  },

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, userId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (![OrderStatus.PLACED, OrderStatus.PAID].includes(order.status as OrderStatus)) {
      throw new AppError('Cannot cancel order in current status', 400);
    }

    // Cancel order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Restore inventory
    const items = await prisma.orderItem.findMany({
      where: { orderId },
    });

    for (const item of items) {
      await productService.restoreInventory(item.productId, item.quantity);
    }
  },

  /**
   * Get vendor orders
   */
  async getVendorOrders(
    vendorId: string,
    params: {
      status?: OrderItemStatus;
      page?: number;
      limit?: number;
    }
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.orderItem.findMany({
        where: {
          vendorId,
          ...(params.status && { status: params.status }),
        },
        include: {
          order: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          product: {
            select: {
              name: true,
              images: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.orderItem.count({
        where: {
          vendorId,
          ...(params.status && { status: params.status }),
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },
};
