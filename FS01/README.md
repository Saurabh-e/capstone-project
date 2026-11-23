# Multi-Vendor E-Commerce Marketplace

A comprehensive fullstack e-commerce platform supporting multiple vendors with separate product management, order processing, payment splitting, and administrative controls.

## 🏗️ Architecture Overview

### System Components
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions and cart
- **Search**: Elasticsearch for product search
- **Storage**: AWS S3 for images
- **Payments**: Stripe Connect for split payments
- **Deployment**: Docker containers

### User Roles
1. **Customer**: Browse, purchase, review products
2. **Vendor**: Manage products, view orders, track sales
3. **Admin**: Platform management, analytics, user moderation

## 📁 Project Structure

```
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── store/           # State management
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── Dockerfile
│
├── backend/                  # Express backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── prisma/          # Database schema
│   └── Dockerfile
│
├── docs/                     # Documentation
│   ├── architecture.md
│   ├── api-documentation.md
│   └── database-schema.md
│
└── docker-compose.yml        # Docker orchestration
```

## 🚀 Features

### Core Features
- ✅ Multi-vendor product management
- ✅ Role-based authentication (JWT)
- ✅ Advanced product search with filters
- ✅ Shopping cart with Redis caching
- ✅ Complete order lifecycle management
- ✅ Split payment processing
- ✅ Product reviews and ratings
- ✅ Coupon/discount system
- ✅ PDF invoice generation
- ✅ Admin analytics dashboard

### Technical Features
- RESTful API architecture
- Database migrations with Prisma
- S3 image storage
- Elasticsearch integration
- Redis session management
- Secure payment processing
- Email notifications
- Comprehensive error handling

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis
- Elasticsearch 8+
- AWS Account (for S3)
- Stripe Account

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"
REDIS_URL="redis://localhost:6379"
ELASTICSEARCH_URL="http://localhost:9200"
JWT_SECRET="your-secret-key"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PORT=3001
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:3001/api
```

### Quick Start with Docker

```bash
# Clone and setup
git clone <repository>
cd capstone-project

# Start all services
docker-compose up -d

# Run migrations
cd backend
npm run prisma:migrate

# Seed database (optional)
npm run seed

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Manual Setup

```bash
# Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend setup
cd frontend
npm install
npm run dev
```

## 📊 Database Schema

See [docs/database-schema.md](docs/database-schema.md) for detailed schema documentation.

### Key Entities
- Users (Customer, Vendor, Admin)
- Products
- Orders & OrderItems
- Payments
- Reviews
- Coupons
- Vendor Profiles

## 🔌 API Documentation

See [docs/api-documentation.md](docs/api-documentation.md) for complete API reference.

### API Endpoints Overview
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/products` - Search products
- `POST /api/cart` - Add to cart
- `POST /api/orders` - Create order
- `POST /api/payments` - Process payment
- `GET /api/admin/analytics` - Admin dashboard

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run E2E tests
npm run test:e2e
```

## 📈 Performance Metrics

- Average API response time: < 200ms
- Product search latency: < 100ms (Elasticsearch)
- Cart operations: < 50ms (Redis)
- Database query optimization with indexes
- Image CDN delivery
- Lazy loading and code splitting

## 🔒 Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- SQL injection prevention (Prisma)
- XSS protection
- CSRF tokens
- Rate limiting
- Input validation
- Secure payment processing (PCI compliant via Stripe)

## 📦 Deployment

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
- Frontend: Deploy to Vercel/Netlify
- Backend: Deploy to AWS EC2/DigitalOcean
- Database: AWS RDS PostgreSQL
- Redis: AWS ElastiCache
- Elasticsearch: AWS Elasticsearch Service

## 📄 License

MIT

## 👥 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📞 Support

For issues and questions, please open a GitHub issue.
