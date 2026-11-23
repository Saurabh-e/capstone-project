# System Architecture

## Overview

The Multi-Vendor E-Commerce Marketplace follows a microservices-inspired architecture with clear separation between frontend, backend, and data layers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │   React Frontend (TypeScript + Tailwind CSS)           │    │
│  │   - Customer Portal                                     │    │
│  │   - Vendor Dashboard                                    │    │
│  │   - Admin Panel                                         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │   Express.js Backend (Node.js + TypeScript)            │    │
│  │                                                          │    │
│  │   ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │    │
│  │   │Auth Service  │  │Product Service│  │Order Service│ │    │
│  │   └──────────────┘  └──────────────┘  └────────────┘  │    │
│  │                                                          │    │
│  │   ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │    │
│  │   │Payment Service│ │Review Service│  │Analytics   │  │    │
│  │   └──────────────┘  └──────────────┘  └────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
              │              │              │             │
              ▼              ▼              ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │Elasticsearch │          │
│  │  (Primary DB)│  │  (Cache/     │  │  (Product    │          │
│  │              │  │   Sessions)  │  │   Search)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │   AWS S3     │  │    Stripe    │                             │
│  │  (Images)    │  │  (Payments)  │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend Layer

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Zustand/Redux for state management
- Axios for API calls
- React Query for server state

**Key Modules:**

#### Customer Portal
- Product browsing and search
- Shopping cart management
- Checkout and payment
- Order tracking
- Product reviews
- User profile management

#### Vendor Dashboard
- Product CRUD operations
- Image upload interface
- Order management
- Sales analytics
- Revenue tracking
- Profile settings

#### Admin Panel
- User management
- Vendor approval
- Platform analytics
- Coupon management
- System monitoring
- Content moderation

### 2. Backend Layer

**Technology Stack:**
- Node.js with Express.js
- TypeScript for type safety
- Prisma ORM for database access
- JWT for authentication
- Multer for file uploads
- Bull for job queues

**Service Architecture:**

#### Auth Service
```typescript
Responsibilities:
- User registration (customer/vendor)
- Login with JWT generation
- Password reset flow
- Role-based access control (RBAC)
- Refresh token management
```

#### Product Service
```typescript
Responsibilities:
- CRUD operations for products
- Image upload to S3
- Product categorization
- Inventory management
- Elasticsearch indexing
- Bulk operations
```

#### Order Service
```typescript
Responsibilities:
- Cart management (Redis)
- Order creation and validation
- Order lifecycle management:
  * PLACED → PAID → PROCESSING → PACKED → SHIPPED → DELIVERED
- Order cancellation/refunds
- Invoice generation (PDF)
```

#### Payment Service
```typescript
Responsibilities:
- Stripe Connect integration
- Payment intent creation
- Split payment to vendors
- Commission calculation
- Payout management
- Webhook handling
```

#### Review Service
```typescript
Responsibilities:
- Product reviews and ratings
- Review moderation
- Helpful votes
- Vendor responses
```

#### Analytics Service
```typescript
Responsibilities:
- Sales metrics aggregation
- Revenue calculations
- User activity tracking
- Performance dashboards
- Report generation
```

### 3. Data Layer

#### PostgreSQL Database
- Primary data store
- ACID compliance for transactions
- Relational data modeling
- Full-text search capabilities
- Backup and recovery

**Key Tables:**
- users
- vendor_profiles
- products
- orders
- order_items
- payments
- reviews
- coupons
- categories

#### Redis Cache
```
Use Cases:
- Session storage (30 min TTL)
- Shopping cart (7 days TTL)
- Product cache (1 hour TTL)
- Rate limiting counters
- Real-time analytics buffers
```

#### Elasticsearch
```
Use Cases:
- Fast product search
- Faceted filtering
- Full-text search with relevance
- Autocomplete suggestions
- Search analytics
```

**Product Index Schema:**
```json
{
  "product_id": "uuid",
  "name": "text",
  "description": "text",
  "category": "keyword",
  "vendor_id": "keyword",
  "price": "float",
  "rating": "float",
  "inventory": "integer",
  "created_at": "date"
}
```

#### AWS S3
```
Structure:
/products/{vendor_id}/{product_id}/{image_id}.jpg
- Secure presigned URLs
- CloudFront CDN integration
- Image optimization pipeline
- Versioning enabled
```

#### Stripe Connect
```
Architecture:
- Platform account (marketplace)
- Connected accounts (vendors)
- Express accounts for quick onboarding
- Automated commission splits
- Payout scheduling
```

## Security Architecture

### Authentication Flow
```
1. User Login → Backend validates credentials
2. Generate JWT (access token) + Refresh token
3. Store refresh token in Redis (httpOnly cookie)
4. Access token expires in 15 minutes
5. Refresh token expires in 7 days
6. Automatic token refresh on API calls
```

### Authorization Layers
```
Middleware Chain:
1. authenticateToken - Verify JWT
2. authorizeRole(['vendor', 'admin']) - Check user role
3. resourceOwnership - Verify resource access
4. rateLimit - Prevent abuse
```

### Data Protection
- Passwords: bcrypt with salt rounds = 12
- Sensitive data: Encrypted at rest
- API keys: Environment variables
- Database: SSL connections
- S3: Private buckets with signed URLs

## Scalability Strategy

### Horizontal Scaling
- Stateless backend servers
- Load balancer (Nginx/AWS ALB)
- Redis cluster for distributed cache
- PostgreSQL read replicas
- Elasticsearch cluster

### Performance Optimization
1. **Caching Strategy:**
   - Redis for hot data
   - Browser caching headers
   - CDN for static assets

2. **Database Optimization:**
   - Indexed columns (product_id, user_id, order_id)
   - Query optimization
   - Connection pooling
   - Pagination on large datasets

3. **API Optimization:**
   - Response compression (gzip)
   - API rate limiting
   - GraphQL for flexible queries (future)
   - Batch operations

4. **Frontend Optimization:**
   - Code splitting
   - Lazy loading
   - Image optimization (WebP)
   - Service workers (PWA)

## Deployment Architecture

### Docker Containers
```yaml
Services:
- frontend (React app)
- backend (Express API)
- postgres (Database)
- redis (Cache)
- elasticsearch (Search)
- nginx (Reverse proxy)
```

### Production Environment
```
Frontend:
- Vercel/Netlify for static hosting
- CDN for global distribution
- Environment-based configuration

Backend:
- AWS EC2 / DigitalOcean Droplets
- PM2 for process management
- Auto-scaling groups
- Health checks

Database:
- AWS RDS PostgreSQL (Multi-AZ)
- Automated backups
- Point-in-time recovery

Cache & Search:
- AWS ElastiCache (Redis)
- AWS Elasticsearch Service
- Managed services for reliability
```

## Monitoring & Logging

### Application Monitoring
- Winston for structured logging
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Uptime monitoring (UptimeRobot)

### Infrastructure Monitoring
- Docker container health
- Database performance metrics
- Cache hit rates
- API response times
- Error rates and 5xx responses

### Business Metrics
- Order conversion rate
- Average order value
- Vendor performance
- Customer lifetime value
- Churn rate

## Disaster Recovery

### Backup Strategy
- Database: Daily automated backups (30-day retention)
- S3: Versioning enabled
- Redis: RDB snapshots
- Configuration: Version control

### Recovery Procedures
- RTO (Recovery Time Objective): < 1 hour
- RPO (Recovery Point Objective): < 15 minutes
- Automated failover for critical services
- Documented runbooks

## API Rate Limiting

```
Rate Limits by Role:
- Anonymous: 100 requests/15 min
- Customer: 500 requests/15 min
- Vendor: 1000 requests/15 min
- Admin: Unlimited

Specific Endpoints:
- Login: 5 attempts/15 min
- Password Reset: 3 attempts/hour
- Image Upload: 10 uploads/hour
```

## Third-Party Integrations

### Payment Processing
- Stripe Connect for marketplace payments
- PCI compliance via Stripe
- Webhook verification

### Email Service
- SendGrid/AWS SES
- Transactional emails (orders, password reset)
- Marketing emails (optional)

### Storage
- AWS S3 for file storage
- CloudFront CDN distribution
- Image resizing pipeline (Lambda)

### Analytics
- Google Analytics for user tracking
- Internal analytics dashboard
- Business intelligence tools

## Future Enhancements

1. **Microservices Migration**
   - Split services into independent deployments
   - Message queue (RabbitMQ/Kafka)
   - API Gateway

2. **Real-time Features**
   - WebSocket for live updates
   - Real-time chat support
   - Live inventory updates

3. **Advanced Features**
   - AI-powered recommendations
   - Multi-language support
   - Multi-currency support
   - Mobile app (React Native)

4. **Performance**
   - GraphQL API
   - Server-side rendering (SSR)
   - Edge caching
   - Database sharding
