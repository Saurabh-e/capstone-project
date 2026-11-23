import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { productService } from '../services/product.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Public routes
router.get('/', async (req, res, next) => {
  try {
    const result = await productService.searchProducts({
      q: req.query.q as string,
      category: req.query.category as string,
      vendor: req.query.vendor as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined,
      sort: req.query.sort as string,
      order: req.query.order as 'asc' | 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    });\n    \n    res.json({\n      success: true,\n      data: result,\n    });\n  } catch (error) {\n    next(error);\n  }\n});\n\nrouter.get('/:id', async (req, res, next) => {\n  try {\n    const product = await productService.getProduct(req.params.id);\n    \n    if (!product) {\n      throw new AppError('Product not found', 404);\n    }\n    \n    res.json({\n      success: true,\n      data: product,\n    });\n  } catch (error) {\n    next(error);\n  }\n});\n\n// Vendor routes\nrouter.post('/', authenticate, authorize(UserRole.VENDOR), async (req, res, next) => {\n  try {\n    const product = await productService.createProduct(req.user!.userId, req.body);\n    res.status(201).json({\n      success: true,\n      data: product,\n      message: 'Product created successfully',\n    });\n  } catch (error) {\n    next(error);\n  }\n});\n\nrouter.put('/:id', authenticate, authorize(UserRole.VENDOR), async (req, res, next) => {\n  try {\n    const product = await productService.updateProduct(req.params.id, req.user!.userId, req.body);\n    res.json({\n      success: true,\n      data: product,\n      message: 'Product updated successfully',\n    });\n  } catch (error) {\n    next(error);\n  }\n});\n\nrouter.delete('/:id', authenticate, authorize(UserRole.VENDOR), async (req, res, next) => {\n  try {\n    await productService.deleteProduct(req.params.id, req.user!.userId);\n    res.json({\n      success: true,\n      message: 'Product deleted successfully',\n    });\n  } catch (error) {\n    next(error);\n  }\n});\n\nrouter.post('/:id/images', authenticate, authorize(UserRole.VENDOR), async (req, res, next) => {\n  try {\n    // TODO: Implement multer middleware for file upload\n    res.json({ success: true, message: 'Image upload - To be implemented with multer' });\n  } catch (error) {\n    next(error);\n  }\n});\n\nexport default router;
