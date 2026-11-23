import { PrismaClient, CouponType } from '@prisma/client';
import { cacheUtil } from '../config/redis';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const couponService = {
  /**
   * Validate coupon
   */
  async validateCoupon(
    code: string,
    userId: string,
    subtotal: number
  ): Promise<{
    valid: boolean;
    coupon?: any;
    discount?: number;
    error?: string;
  }> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return { valid: false, error: 'Coupon not found' };
    }

    // Check if active
    if (!coupon.active) {
      return { valid: false, error: 'Coupon is not active' };
    }

    // Check dates
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return { valid: false, error: 'Coupon has expired' };
    }

    // Check minimum purchase
    if (subtotal < parseFloat(coupon.minPurchase.toString())) {
      return {
        valid: false,
        error: `Minimum purchase of $${coupon.minPurchase} required`,
      };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    // Check per-user limit
    const userUsageKey = `coupon:${coupon.id}:user:${userId}`;
    const userUsageCount = await cacheUtil.get(userUsageKey);

    if (userUsageCount >= coupon.perUserLimit) {
      return { valid: false, error: 'You have reached the usage limit for this coupon' };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (subtotal * parseFloat(coupon.value.toString())) / 100;
      if (coupon.maxDiscount && discount > parseFloat(coupon.maxDiscount.toString())) {
        discount = parseFloat(coupon.maxDiscount.toString());
      }
    } else {
      discount = parseFloat(coupon.value.toString());
    }

    return {
      valid: true,
      coupon,
      discount,
    };
  },

  /**
   * Increment coupon usage
   */
  async incrementUsage(code: string, userId: string): Promise<void> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    // Update global usage count
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });

    // Update per-user usage count
    const userUsageKey = `coupon:${coupon.id}:user:${userId}`;
    const currentCount = (await cacheUtil.get(userUsageKey)) || 0;
    await cacheUtil.set(userUsageKey, currentCount + 1, 365 * 24 * 60 * 60); // 1 year TTL
  },

  /**
   * Create coupon (admin only)
   */
  async createCoupon(data: {
    code: string;
    type: CouponType;
    value: number;
    minPurchase?: number;
    maxDiscount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    validFrom: Date;
    validUntil: Date;
    createdBy?: string;
  }): Promise<any> {
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        minPurchase: data.minPurchase || 0,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit || 1,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        createdBy: data.createdBy,
      },
    });

    return coupon;
  },

  /**
   * Get all coupons
   */
  async getCoupons(params: {
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where: {
          ...(params.active !== undefined && { active: params.active }),
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.count({
        where: {
          ...(params.active !== undefined && { active: params.active }),
        },
      }),
    ]);

    return {
      coupons,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Update coupon
   */
  async updateCoupon(couponId: string, data: Partial<any>): Promise<any> {
    return await prisma.coupon.update({
      where: { id: couponId },
      data,
    });
  },

  /**
   * Delete coupon
   */
  async deleteCoupon(couponId: string): Promise<void> {
    await prisma.coupon.delete({
      where: { id: couponId },
    });
  },
};
