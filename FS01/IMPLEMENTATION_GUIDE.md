# Implementation Guide - Multi-Vendor E-Commerce Marketplace

## Project Status

✅ **Completed:**
1. Project structure and architecture design
2. Database schema with Prisma
3. API documentation (40+ endpoints)
4. Backend configuration (Redis, Elasticsearch, S3, Stripe)
5. Authentication system with JWT
6. Middleware (auth, validation, rate limiting, error handling)
7. Docker setup with PostgreSQL, Redis, Elasticsearch

⏳ **Remaining Implementation:**
1. Complete backend services and controllers
2. Frontend React application
3. Payment integration testing
4. Email service setup
5. PDF invoice generation
6. Testing suite
7. Deployment configuration

## Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init

# Frontend
cd frontend
npm install
```

### 2. Configure Environment

Copy `backend/.env.example` to `backend/.env` and update:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce"
REDIS_URL="redis://localhost:6379"
ELASTICSEARCH_NODE="http://localhost:9200"
JWT_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_test_..."
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_S3_BUCKET="your-bucket"
```

### 3. Start with Docker

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Elasticsearch on port 9200
- Backend API on port 3001
- Frontend on port 3000

### 4. Run Migrations

```bash
cd backend
npx prisma migrate dev
```

## Implementation Milestones

### Milestone 1: Database & Auth ✅
- [x] Prisma schema with all models
- [x] User authentication (register, login, JWT)
- [x] Role-based access control (Customer, Vendor, Admin)
- [x] Password hashing with bcrypt

**Files Created:**
- `backend/prisma/schema.prisma`
- `backend/src/services/auth.service.ts`
- `backend/src/utils/jwt.ts`
- `backend/src/utils/password.ts`
- `backend/src/middleware/auth.ts`

**To Test:**
```bash
# Register user
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "Test123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}

# Login
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "Test123!"
}
```

### Milestone 2: Vendor Onboarding (In Progress)

**Required Services:**
1. **VendorService** (`backend/src/services/vendor.service.ts`)
   - Create vendor profile
   - Update vendor details
   - Stripe Connect integration
   - Verification workflow

2. **VendorController** (`backend/src/controllers/vendor.controller.ts`)
   - POST /api/vendors/profile
   - PUT /api/vendors/profile
   - POST /api/vendors/stripe/connect
   - GET /api/vendors/:id

3. **VendorRoutes** (`backend/src/routes/vendor.routes.ts`)

**Implementation Steps:**
```typescript
// 1. Create vendor profile service
export const vendorService = {
  async createProfile(userId: string, data: {
    businessName: string;
    description?: string;
    // ...
  }) {
    // Check if profile exists
    // Create vendor profile
    // Create Stripe Connect account
    // Return profile
  }
}

// 2. Create Stripe Connect flow
// Use stripeUtils.createConnectAccount()
// Use stripeUtils.createAccountLink()

// 3. Handle onboarding webhook
// Verify vendor is fully onboarded
// Update verified status
```

### Milestone 3: Product Management

**Required Services:**
1. **ProductService** (`backend/src/services/product.service.ts`)
   - CRUD operations
   - Image upload to S3
   - Elasticsearch indexing
   - Inventory management

2. **ProductController** (`backend/src/controllers/product.controller.ts`)
3. **ProductRoutes** (`backend/src/routes/product.routes.ts`)

**Key Functions:**
```typescript
// Product creation with S3 upload
async createProduct(vendorId, data, images) {
  // 1. Upload images to S3
  const imageUrls = await s3Utils.uploadFiles(images, `products/${vendorId}`);
  
  // 2. Create product in database
  const product = await prisma.product.create({
    data: {
      ...data,
      images: imageUrls,
      vendorId
    }
  });
  
  // 3. Index in Elasticsearch
  await productSearch.indexProduct({
    id: product.id,
    name: product.name,
    // ... map all fields
  });
  
  return product;
}
```

### Milestone 4: Search with Elasticsearch

**Integration Points:**
- Product creation → Index product
- Product update → Update index
- Product delete → Remove from index
- Search endpoint → Query Elasticsearch

**Search Implementation:**
```typescript
// GET /api/products?q=laptop&minPrice=500&maxPrice=2000&sort=price
async searchProducts(params) {
  const result = await productSearch.searchProducts({
    q: params.q,
    category: params.category,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    rating: params.rating,
    sort: params.sort || 'createdAt',
    order: params.order || 'desc',
    page: params.page || 1,
    limit: params.limit || 20,
  });
  
  return result;
}
```

### Milestone 5: Cart & Checkout with Redis

**CartService** (`backend/src/services/cart.service.ts`)
```typescript
export const cartService = {
  // Store cart in Redis with 7-day TTL
  async getCart(userId: string) {
    const cartKey = `cart:${userId}`;
    return await cacheUtil.get(cartKey);
  },
  
  async addToCart(userId: string, productId: string, quantity: number) {
    // Get product details
    // Add to cart in Redis
    // Update cart totals
    await cacheUtil.set(`cart:${userId}`, cart, 7 * 24 * 60 * 60);
  },
  
  async clearCart(userId: string) {
    await cacheUtil.del(`cart:${userId}`);
  }
}
```

### Milestone 6: Order Lifecycle

**OrderService** (`backend/src/services/order.service.ts`)
```typescript
export const orderService = {
  async createOrder(userId, orderData) {
    // 1. Get cart from Redis
    // 2. Validate inventory
    // 3. Apply coupon if provided
    // 4. Create order in database
    // 5. Create order items
    // 6. Update product inventory
    // 7. Clear cart
    // 8. Return order
  },
  
  async updateOrderStatus(orderId, status) {
    // Update order status
    // Handle state transitions:
    // PLACED → PAID → PROCESSING → PACKED → SHIPPED → DELIVERED
    // Send email notifications
  }
}
```

**Order Status Flow:**
```
Customer places order → PLACED
Payment succeeds → PAID
Vendor processes → PROCESSING
Vendor packs → PACKED
Vendor ships → SHIPPED (add tracking number)
Delivery confirmed → DELIVERED
```

### Milestone 7: Payment Processing

**PaymentService** (`backend/src/services/payment.service.ts`)
```typescript
export const paymentService = {
  async createPaymentIntent(orderId: string) {
    // 1. Get order details
    // 2. Calculate vendor splits
    const vendorSplits = orderItems.map(item => {
      const { platformFee, vendorAmount } = stripeUtils.calculateSplit(
        item.total,
        vendor.commissionRate
      );
      return {
        accountId: vendor.stripeAccountId,
        amount: vendorAmount
      };
    });
    
    // 3. Create PaymentIntent
    const paymentIntent = await stripeUtils.createPaymentIntent({
      amount: order.total,
      vendorSplits,
      metadata: { orderId }
    });
    
    // 4. Save payment record
    await prisma.payment.create({
      data: {
        orderId,
        stripePaymentId: paymentIntent.id,
        amount: order.total,
        vendorSplits: JSON.stringify(vendorSplits)
      }
    });
    
    return paymentIntent.client_secret;
  },
  
  async handleWebhook(event: Stripe.Event) {
    // Handle payment events
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Update order status to PAID
        break;
      case 'payment_intent.payment_failed':
        // Handle payment failure
        break;
    }
  }
}
```

### Milestone 8: Reviews System

**ReviewService** (`backend/src/services/review.service.ts`)
```typescript
export const reviewService = {
  async createReview(data) {
    // 1. Verify purchase
    // 2. Check if already reviewed
    // 3. Create review
    // 4. Update product rating
    await updateProductRating(productId);
  },
  
  async updateProductRating(productId: string) {
    // Calculate average rating
    const avg = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true
    });
    
    // Update product
    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: avg._avg.rating,
        reviewCount: avg._count
      }
    });
    
    // Update Elasticsearch
    await productSearch.updateProduct(productId, {
      rating: avg._avg.rating,
      reviewCount: avg._count
    });
  }
}
```

### Milestone 9: Coupons & Discounts

**CouponService** (`backend/src/services/coupon.service.ts`)
```typescript
export const couponService = {
  async validateCoupon(code: string, userId: string, subtotal: number) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });
    
    // Validate:
    // - Active
    // - Valid dates
    // - Min purchase
    // - Usage limit
    // - Per user limit
    
    // Calculate discount
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }
    
    return { valid: true, coupon, discount };
  }
}
```

### Milestone 10: Admin Analytics

**AnalyticsService** (`backend/src/services/analytics.service.ts`)
```typescript
export const analyticsService = {
  async getPlatformAnalytics(startDate, endDate) {
    const [
      revenue,
      orders,
      users,
      products
    ] = await Promise.all([
      // Revenue metrics
      prisma.payment.aggregate({
        where: {
          status: 'SUCCEEDED',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true },
        _count: true
      }),
      
      // Order metrics
      prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: true
      }),
      
      // User metrics
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      
      // Product metrics
      prisma.product.groupBy({
        by: ['status'],
        _count: true
      })
    ]);
    
    return {
      revenue,
      orders,
      users,
      products,
      topVendors: await getTopVendors(startDate, endDate)
    };
  }
}
```

### Milestone 11: PDF Invoices

**InvoiceService** (`backend/src/services/invoice.service.ts`)
```typescript
import PDFDocument from 'pdfkit';

export const invoiceService = {
  async generateInvoice(orderId: string): Promise<Buffer> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true, payment: true }
    });
    
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    
    // Add company header
    doc.fontSize(20).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text(`Invoice #: ${order.orderNumber}`);
    
    // Add order details
    // Add items table
    // Add totals
    // Add payment info
    
    doc.end();
    
    return Buffer.concat(chunks);
  }
}
```

## Frontend Implementation

### Technology Stack
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- React Query for server state
- Axios for API calls

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/         # Reusable components
│   │   ├── layout/         # Layout components
│   │   ├── product/        # Product components
│   │   └── cart/           # Cart components
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── Orders.tsx
│   │   ├── vendor/         # Vendor dashboard
│   │   └── admin/          # Admin panel
│   ├── services/
│   │   ├── api.ts          # Axios configuration
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   └── order.service.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── helpers.ts
│   └── App.tsx
└── package.json
```

### Key Pages to Implement

1. **Customer Pages:**
   - Home with featured products
   - Product listing with filters
   - Product detail with reviews
   - Shopping cart
   - Checkout with Stripe
   - Order history
   - Order tracking

2. **Vendor Dashboard:**
   - Product management
   - Order management
   - Sales analytics
   - Profile settings

3. **Admin Panel:**
   - User management
   - Vendor approval
   - Platform analytics
   - Coupon management

## Testing Strategy

### Backend Tests
```bash
npm test
```

**Test Coverage:**
- Unit tests for services
- Integration tests for API endpoints
- Authentication flow tests
- Payment processing tests
- Order lifecycle tests

**Example Test:**
```typescript
describe('AuthService', () => {
  it('should register a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'John',
      lastName: 'Doe'
    };
    
    const result = await authService.register(userData);
    
    expect(result.user.email).toBe(userData.email);
    expect(result.accessToken).toBeDefined();
  });
});
```

### Frontend Tests
- Component tests with React Testing Library
- E2E tests with Playwright/Cypress
- Integration tests for user flows

## Deployment Guide

### Backend Deployment (AWS EC2)

```bash
# 1. Setup EC2 instance
# 2. Install dependencies
sudo apt update
sudo apt install nodejs npm postgresql redis-server

# 3. Clone repository
git clone <repository>
cd backend

# 4. Install packages
npm install
npx prisma generate
npx prisma migrate deploy

# 5. Setup PM2
npm install -g pm2
pm2 start dist/index.js --name ecommerce-api
pm2 startup
pm2 save

# 6. Setup Nginx reverse proxy
sudo apt install nginx
# Configure nginx to proxy port 80 to 3001
```

### Frontend Deployment (Vercel)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
cd frontend
vercel --prod
```

### Database (AWS RDS)
- Create PostgreSQL instance
- Update DATABASE_URL in backend .env
- Run migrations

### Redis (AWS ElastiCache)
- Create Redis cluster
- Update REDIS_URL in backend .env

### Elasticsearch (AWS Elasticsearch Service)
- Create Elasticsearch domain
- Update ELASTICSEARCH_NODE in backend .env

### S3 Setup
```bash
# 1. Create S3 bucket
aws s3 mb s3://your-bucket-name

# 2. Set CORS configuration
aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration file://cors.json

# 3. Update environment variables
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=your-bucket-name
```

## Performance Optimization

### Backend
1. **Database Indexing** - Already configured in Prisma schema
2. **Redis Caching** - Cache frequently accessed data
3. **Connection Pooling** - Prisma handles this automatically
4. **Query Optimization** - Use `include` and `select` wisely
5. **Pagination** - Implemented in search endpoints

### Frontend
1. **Code Splitting** - Use React.lazy()
2. **Image Optimization** - Use WebP format, lazy loading
3. **Memoization** - Use React.memo, useMemo, useCallback
4. **Virtual Scrolling** - For long product lists
5. **Service Worker** - For offline functionality

## Security Checklist

- [x] Password hashing with bcrypt
- [x] JWT authentication
- [x] Rate limiting
- [x] CORS configuration
- [x] Helmet for security headers
- [x] Input validation with Joi
- [x] SQL injection prevention (Prisma)
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] SSL/TLS in production
- [ ] Environment variable protection
- [ ] API key rotation
- [ ] Security audits

## Monitoring

### Application Monitoring
- Winston for logging
- Sentry for error tracking
- New Relic for performance
- UptimeRobot for uptime

### Business Metrics
- Order conversion rate
- Average order value
- Customer lifetime value
- Vendor performance
- Revenue tracking

## Next Steps

1. **Complete remaining services and controllers**
2. **Build frontend application**
3. **Implement email notifications**
4. **Setup testing suite**
5. **Configure CI/CD pipeline**
6. **Performance testing**
7. **Security audit**
8. **Production deployment**

## Resources

- **Prisma Documentation:** https://www.prisma.io/docs
- **Stripe Connect Guide:** https://stripe.com/docs/connect
- **Elasticsearch Guide:** https://www.elastic.co/guide
- **Redis Documentation:** https://redis.io/documentation
- **AWS S3 Guide:** https://docs.aws.amazon.com/s3

## Support

For questions and issues:
1. Check API documentation in `docs/api-documentation.md`
2. Review architecture diagram in `docs/architecture.md`
3. Check database schema in `docs/database-schema.md`
4. Open GitHub issue

---

**Project Progress: 40% Complete**

**Estimated Time to Complete:**
- Backend Services: 20 hours
- Frontend Application: 30 hours
- Testing: 15 hours
- Deployment: 10 hours
- **Total: ~75 hours**
