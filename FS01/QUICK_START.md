# Quick Start Guide

Get the Multi-Vendor E-Commerce Marketplace up and running in minutes!

## 🚀 Fast Track Setup (Windows PowerShell)

### Option 1: Automated Setup (Recommended)

```powershell
# Run the setup script
.\setup.ps1

# This will:
# - Check prerequisites (Node.js, Docker)
# - Install dependencies
# - Generate Prisma client
# - Create .env files
```

### Option 2: Manual Setup

#### Step 1: Clone Repository
```bash
git clone <repository-url>
cd capstone-project
```

#### Step 2: Install Dependencies

**Backend:**
```bash
cd backend
npm install
npx prisma generate
cp .env.example .env
# Edit .env with your credentials
cd ..
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
# Keep default VITE_API_URL=http://localhost:3001/api
cd ..
```

#### Step 3: Start Services

**With Docker (Recommended):**
```bash
docker-compose up -d
```

**Manual (Without Docker):**
```bash
# Terminal 1: PostgreSQL & Redis
# Start PostgreSQL and Redis manually or use Docker for just those:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
docker run -d -p 6379:6379 redis:7

# Terminal 2: Backend
cd backend
npx prisma migrate dev --name init
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

#### Step 4: Access Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| API Health | http://localhost:3001/health |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |
| Elasticsearch | http://localhost:9200 |

## 🔑 Default Credentials

Create a test account:

**Register:**
- Email: `test@example.com`
- Password: `Test123!` (must have uppercase, lowercase, number, special char)
- First Name: `John`
- Last Name: `Doe`

**Vendor Registration:**
- Same as above but select role as `VENDOR`

**Admin:**
- Create manually in database (set role to ADMIN)

## 🧪 Testing the API

### Test Authentication

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Save the accessToken from response
export TOKEN="your-access-token"

# Get Current User
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Test Products

```bash
# Search products (no auth required)
curl http://localhost:3001/api/products

# Create product (vendor only)
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "A test product",
    "price": 29.99,
    "inventory": 100
  }'
```

### Test Cart

```bash
# Get cart
curl http://localhost:3001/api/cart \
  -H "Authorization: Bearer $TOKEN"

# Add to cart
curl -X POST http://localhost:3001/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-id-here",
    "quantity": 1
  }'
```

## 📁 Project Structure

```
capstone-project/
├── backend/                 # Express API
│   ├── src/
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Middleware
│   │   ├── config/         # Services (Redis, ES, S3)
│   │   └── utils/          # Utilities
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
│
├── frontend/               # React app
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── store/         # State management
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main component
│   └── package.json
│
├── docs/                   # Documentation
├── docker-compose.yml      # Docker setup
└── README.md               # Project overview
```

## 🛠️ Common Commands

### Backend

```bash
cd backend

# Development
npm run dev              # Start dev server with hot-reload

# Database
npx prisma studio      # Open Prisma Studio (GUI)
npx prisma migrate dev # Run migrations
npx prisma generate    # Generate Prisma Client

# Production
npm run build           # Build TypeScript
npm start              # Start built app

# Linting & Formatting
npm run lint           # Run ESLint
npm run format         # Format with Prettier
```

### Frontend

```bash
cd frontend

# Development
npm run dev            # Start Vite dev server

# Building
npm run build          # Build for production

# Preview
npm run preview        # Preview production build

# Linting & Formatting
npm run lint           # Run ESLint
npm run format         # Format with Prettier
```

### Docker

```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild containers
docker-compose up -d --build

# Run command in container
docker exec -it ecommerce_backend npx prisma migrate dev
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Required for local development
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_NODE=http://localhost:9200
JWT_SECRET=dev-secret-key
PORT=3001
```

### Frontend (.env)

```env
# Default - points to local backend
VITE_API_URL=http://localhost:3001/api
```

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process (replace PID with actual)
taskkill /PID <PID> /F
```

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Or manually start:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
```

### "Module not found" error
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Generate Prisma client
npx prisma generate
```

### "Port 3001 already in use"
```bash
# Change port in backend/.env
PORT=3002

# Update frontend API URL
# VITE_API_URL=http://localhost:3002/api
```

## 📚 Documentation Links

- **Full README**: [README.md](README.md)
- **API Docs**: [docs/api-documentation.md](docs/api-documentation.md)
- **Architecture**: [docs/architecture.md](docs/architecture.md)
- **Database Schema**: [docs/database-schema.md](docs/database-schema.md)
- **Implementation Guide**: [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
- **Deployment**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 🚀 Next Steps

1. ✅ **Local Development**
   - Create user accounts (customer, vendor, admin)
   - Browse products
   - Test cart functionality
   - Create orders

2. ✅ **Explore Features**
   - Vendor onboarding
   - Product management
   - Order processing
   - Admin dashboard

3. ✅ **Customize**
   - Update branding
   - Configure email
   - Set up payment gateway
   - Configure AWS S3

4. ✅ **Deploy**
   - Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
   - Choose hosting (AWS, DigitalOcean, etc.)
   - Configure production environment
   - Deploy to production

## 💡 Tips

- **Hot Reload**: Both frontend and backend support hot-reload during development
- **API Testing**: Use Postman or curl to test endpoints
- **Database GUI**: Use `npx prisma studio` for easy database management
- **Logs**: Check container logs: `docker-compose logs -f backend`
- **Performance**: Use browser DevTools to profile frontend performance

## 🆘 Getting Help

1. Check the comprehensive documentation in `docs/`
2. Review API documentation: `docs/api-documentation.md`
3. Check troubleshooting section above
4. Review implementation guide: `IMPLEMENTATION_GUIDE.md`

## ✅ Verification Checklist

- [ ] Node.js installed (`node --version`)
- [ ] Docker installed (`docker --version`)
- [ ] npm dependencies installed
- [ ] PostgreSQL running
- [ ] Redis running
- [ ] Elasticsearch running
- [ ] Backend API accessible (http://localhost:3001/health)
- [ ] Frontend app running (http://localhost:3000)
- [ ] Can register and login
- [ ] Can view products
- [ ] Can add items to cart

## 🎉 You're Ready!

The Multi-Vendor E-Commerce Marketplace is now running locally. Start building and testing!

---

**Happy Coding! 🚀**
