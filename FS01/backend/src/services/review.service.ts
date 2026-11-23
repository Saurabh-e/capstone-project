import { PrismaClient } from '@prisma/client';
import { productService } from './product.service';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const reviewService = {
  /**
   * Create review
   */
  async createReview(
    userId: string,
    productId: string,
    data: {
      rating: number;
      title?: string;
      comment?: string;
      images?: string[];
      orderId?: string;
    }
  ): Promise<any> {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if user already reviewed
    const existing = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existing) {
      throw new AppError('You have already reviewed this product', 400);
    }

    // Check if verified purchase
    let verifiedPurchase = false;
    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
          items: true,
        },
      });

      verifiedPurchase =
        order &&
        order.userId === userId &&
        order.items.some((item) => item.productId === productId);
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        images: data.images || [],
        verifiedPurchase,
        orderId: data.orderId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update product rating
    await reviewService.updateProductRating(productId);

    return review;
  },

  /**
   * Get product reviews
   */
  async getProductReviews(
    productId: string,
    params: {
      rating?: number;
      page?: number;
      limit?: number;
    }
  ): Promise<any> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [reviews, total, summary] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId,
          ...(params.rating && { rating: params.rating }),
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({
        where: {
          productId,
          ...(params.rating && { rating: params.rating }),
        },
      }),
      await reviewService.getReviewSummary(productId),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      summary,
    };
  },

  /**
   * Get review summary
   */
  async getReviewSummary(productId: string): Promise<any> {
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      distribution,
    };
  },

  /**
   * Update product rating
   */
  async updateProductRating(productId: string): Promise<void> {
    const reviews = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });

    const averageRating = reviews._avg.rating || 0;

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: parseFloat(averageRating.toFixed(2)),
        reviewCount: reviews._count,
      },
    });

    // Update in Elasticsearch
    const { productSearch } = await import('../config/elasticsearch');
    await productSearch.updateProduct(productId, {
      rating: averageRating,
      reviewCount: reviews._count,
    });
  },

  /**
   * Mark review helpful
   */
  async markHelpful(reviewId: string): Promise<void> {
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
    });
  },

  /**
   * Add vendor response
   */
  async addVendorResponse(reviewId: string, vendorId: string, response: string): Promise<any> {
    // Verify vendor ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          select: {
            vendorId: true,
          },
        },
      },
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (review.product.vendorId !== vendorId) {
      throw new AppError('Unauthorized', 403);
    }

    return await prisma.review.update({
      where: { id: reviewId },
      data: {
        vendorResponse: response,
        respondedAt: new Date(),
      },
    });
  },
};
