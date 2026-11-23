import { PrismaClient, Product, ProductStatus } from '@prisma/client';
import { s3Utils } from '../config/s3';
import { productSearch } from '../config/elasticsearch';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const productService = {
  /**
   * Create product
   */
  async createProduct(
    vendorId: string,
    data: {
      name: string;
      description?: string;
      price: number;
      comparePrice?: number;
      sku?: string;
      inventory: number;
      categoryIds?: string[];
      images?: Express.Multer.File[];
    }
  ): Promise<Product> {
    // Upload images to S3
    let imageUrls: string[] = [];
    if (data.images && data.images.length > 0) {
      imageUrls = await s3Utils.uploadFiles(data.images, `products/${vendorId}`);
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice,
        sku: data.sku,
        inventory: data.inventory,
        images: imageUrls,
        vendorId,
        status: ProductStatus.ACTIVE,
        ...(data.categoryIds && {
          categories: {
            createMany: {
              data: data.categoryIds.map((id) => ({ categoryId: id })),
            },
          },
        }),
      },
      include: {
        categories: true,
        vendor: true,
      },
    });

    // Index in Elasticsearch
    await productSearch.indexProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice,
      rating: product.rating,
      reviewCount: product.reviewCount,
      inventory: product.inventory,
      status: product.status,
      featured: product.featured,
      vendorId: product.vendorId,
      vendorName: product.vendor.businessName,
      vendorRating: product.vendor.rating,
      categories: product.categories,
      images: product.images,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });

    return product;
  },

  /**
   * Update product
   */
  async updateProduct(
    productId: string,
    vendorId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      comparePrice: number;
      sku: string;
      inventory: number;
      categoryIds: string[];
      status: ProductStatus;
    }>
  ): Promise<Product> {
    // Verify ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.vendorId !== vendorId) {
      throw new AppError('Product not found or access denied', 404);
    }

    // Update product
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        ...(data.categoryIds && {
          categories: {
            deleteMany: {},
            createMany: {
              data: data.categoryIds.map((id) => ({ categoryId: id })),
            },
          },
        }),
      },
      include: {
        categories: true,
        vendor: true,
      },
    });

    // Update Elasticsearch
    await productSearch.updateProduct(productId, {
      name: updated.name,
      description: updated.description,
      price: updated.price,
      comparePrice: updated.comparePrice,
      inventory: updated.inventory,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });

    return updated;
  },

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(productId: string, vendorId: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.vendorId !== vendorId) {
      throw new AppError('Product not found or access denied', 404);
    }

    await prisma.product.update({
      where: { id: productId },
      data: { status: ProductStatus.ARCHIVED },
    });

    // Remove from Elasticsearch
    await productSearch.deleteProduct(productId);
  },

  /**
   * Get product by ID
   */
  async getProduct(productId: string) {
    return await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            rating: true,
            verified: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        reviews: {
          where: { comment: { not: null } },
          select: {
            id: true,
            rating: true,
            comment: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            createdAt: true,
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  /**
   * Search products
   */
  async searchProducts(params: {
    q?: string;
    category?: string;
    vendor?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    return await productSearch.searchProducts(params);
  },

  /**
   * Get vendor products
   */
  async getVendorProducts(
    vendorId: string,
    params: {
      status?: ProductStatus;
      page?: number;
      limit?: number;
    }
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          vendorId,
          ...(params.status && { status: params.status }),
        },
        include: {
          categories: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({
        where: {
          vendorId,
          ...(params.status && { status: params.status }),
        },
      }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 10) {
    return await prisma.product.findMany({
      where: {
        featured: true,
        status: ProductStatus.ACTIVE,
        inventory: { gt: 0 },
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: {
        vendor: {
          select: {
            businessName: true,
            rating: true,
          },
        },
      },
    });
  },

  /**
   * Update product inventory
   */
  async updateInventory(productId: string, quantity: number): Promise<void> {
    await prisma.product.update({
      where: { id: productId },
      data: { inventory: { decrement: quantity } },
    });
  },

  /**
   * Restore product inventory
   */
  async restoreInventory(productId: string, quantity: number): Promise<void> {
    await prisma.product.update({
      where: { id: productId },
      data: { inventory: { increment: quantity } },
    });
  },
};
