# Deployment Guide - Multi-Vendor E-Commerce Marketplace

## Overview

This guide provides comprehensive instructions for deploying the Multi-Vendor E-Commerce Marketplace to production environments. The application can be deployed on AWS, DigitalOcean, or any cloud provider supporting Node.js, PostgreSQL, and Docker.

## Prerequisites

- Docker & Docker Compose installed
- AWS Account (or DigitalOcean/similar)
- Domain name
- SSL Certificate (AWS Certificate Manager or Let's Encrypt)
- Git repository with application code

## Deployment Options

### Option 1: Docker Compose (Local/Development)

```bash
# Clone repository
git clone <repository-url>
cd capstone-project

# Start all services
docker-compose up -d

# Run migrations
docker exec -it ecommerce_backend npx prisma migrate deploy

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Option 2: AWS Elastic Container Service (ECS)

#### 1. Create ECR Repositories

```bash
# Create ECR repositories
aws ecr create-repository --repository-name ecommerce-backend
aws ecr create-repository --repository-name ecommerce-frontend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -t ecommerce-backend:latest ./backend
docker tag ecommerce-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecommerce-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecommerce-backend:latest

# Build and push frontend
docker build -t ecommerce-frontend:latest ./frontend
docker tag ecommerce-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecommerce-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecommerce-frontend:latest
```

#### 2. Create RDS PostgreSQL Database

```bash
# Using AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier ecommerce-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <strong-password> \
  --allocated-storage 20 \
  --multi-az
```

#### 3. Create ElastiCache Redis Cluster

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id ecommerce-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

#### 4. Create Elasticsearch Domain

```bash
aws es create-elasticsearch-domain \
  --domain-name ecommerce \
  --elasticsearch-version 8.11 \
  --instance-type t3.small.elasticsearch \
  --instance-count 1
```

#### 5. Create ECS Task Definitions

Create `ecs-backend-task.json`:
```json
{
  "family": "ecommerce-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/ecommerce-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "hostPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:password@db-host:5432/ecommerce"
        },
        {
          "name": "REDIS_URL",
          "value": "redis://redis-host:6379"
        },
        {
          "name": "ELASTICSEARCH_NODE",
          "value": "http://es-host:9200"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ecommerce-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 6. Create ECS Service

```bash
aws ecs create-service \
  --cluster ecommerce-cluster \
  --service-name ecommerce-backend \
  --task-definition ecommerce-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED} \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3001
```

### Option 3: DigitalOcean App Platform

#### 1. Create app.yaml

```yaml
name: ecommerce-marketplace
services:
- name: backend
  github:
    repo: your-username/ecommerce
    branch: main
  build_command: cd backend && npm install && npx prisma generate
  run_command: cd backend && npm run start
  environment_slug: node-js
  http_port: 3001
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    scope: RUN_AND_BUILD_TIME
    value: ${db.username}:${db.password}@${db.host}:${db.port}/${db.database}
  - key: REDIS_URL
    value: redis://${redis.host}:${redis.port}
  - key: ELASTICSEARCH_NODE
    value: http://${elasticsearch.host}:${elasticsearch.port}
  
- name: frontend
  github:
    repo: your-username/ecommerce
    branch: main
  build_command: cd frontend && npm install && npm run build
  source_dir: frontend/dist
  environment_slug: static
  http_port: 3000

databases:
- name: db
  engine: PG
  version: "15"
  
- name: redis
  engine: REDIS
  version: "7"

static_sites:
- name: frontend
  source_dir: frontend/dist
```

#### 2. Deploy

```bash
# Install doctl CLI
# https://docs.digitalocean.com/reference/doctl/

# Create app
doctl apps create --spec app.yaml
```

### Option 4: Manual Server Deployment (AWS EC2 / DigitalOcean Droplet)

#### 1. Setup Ubuntu Server 22.04

```bash
# SSH into server
ssh -i your-key.pem ubuntu@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
  nodejs \
  npm \
  postgresql-15 \
  postgresql-contrib \
  redis-server \
  nginx \
  certbot \
  python3-certbot-nginx
```

#### 2. Create PostgreSQL Database

```bash
sudo -u postgres psql
CREATE DATABASE ecommerce;
CREATE USER ecommerce WITH PASSWORD 'strong_password';
ALTER ROLE ecommerce SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE ecommerce TO ecommerce;
\q
```

#### 3. Install Elasticsearch

```bash
# Download and install
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.11.0-amd64.deb
sudo dpkg -i elasticsearch-8.11.0-amd64.deb
sudo systemctl start elasticsearch
sudo systemctl enable elasticsearch
```

#### 4. Deploy Application

```bash
# Create app directory
sudo mkdir -p /var/www/ecommerce
sudo chown -R ubuntu:ubuntu /var/www/ecommerce
cd /var/www/ecommerce

# Clone repository
git clone <repository-url> .

# Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate deploy

# Create .env
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://ecommerce:password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_NODE=http://localhost:9200
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
STRIPE_SECRET_KEY=sk_live_...
AWS_S3_BUCKET=your-bucket
EOF

# Frontend setup
cd ../frontend
npm install
npm run build
```

#### 5. Setup PM2 for Process Management

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ecommerce-api',
      script: './backend/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

#### 6. Configure Nginx

```bash
# Create nginx config
sudo cat > /etc/nginx/sites-available/ecommerce << 'EOF'
upstream backend {
  server localhost:3001;
}

server {
  server_name yourdomain.com www.yourdomain.com;
  
  client_max_body_size 50M;

  # Frontend
  location / {
    root /var/www/ecommerce/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  # API proxy
  location /api {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 7. Setup SSL Certificate

```bash
# Install Let's Encrypt certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## Environment Variables Configuration

### Backend .env

```env
# Server
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/ecommerce

# Cache
REDIS_URL=redis://redis-host:6379

# Search
ELASTICSEARCH_NODE=http://es-host:9200

# Authentication
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend .env

```env
VITE_API_URL=https://yourdomain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
```

## Scaling Strategies

### Horizontal Scaling

1. **Load Balancing**
   - AWS ALB or ELB for traffic distribution
   - DigitalOcean Load Balancer
   - Nginx reverse proxy

2. **Database Scaling**
   - AWS RDS read replicas
   - PostgreSQL replication
   - Connection pooling (PgBouncer)

3. **Cache Scaling**
   - AWS ElastiCache cluster
   - Redis Sentinel for HA
   - Multiple Redis instances

4. **Search Scaling**
   - AWS Elasticsearch domains
   - Elasticsearch cluster with multiple nodes
   - Index sharding

### Caching Strategy

```
1. CDN Cache (CloudFront/CloudFlare)
   - Static assets: 30 days
   - HTML: 5 minutes

2. Browser Cache
   - CSS/JS: 1 year with hash
   - Images: 30 days

3. Application Cache (Redis)
   - Products: 1 hour
   - Coupons: 24 hours
   - Sessions: 30 minutes

4. Database Cache
   - Query results: 5 minutes
   - Aggregations: 1 hour
```

## Monitoring & Logging

### Application Monitoring

```bash
# Using New Relic
npm install newrelic
# Add to index.ts: require('newrelic')

# Using Datadog
npm install dd-trace
# Configure in environment
```

### Log Management

```bash
# CloudWatch Logs
docker logs ecommerce_backend

# ELK Stack
# Elasticsearch for storage
# Logstash for processing
# Kibana for visualization

# CloudFlare Logs
# Access logs via dashboard
```

### Health Checks

```bash
# Backend health endpoint
curl https://api.yourdomain.com/health

# Database health
SELECT 1;

# Redis health
redis-cli ping

# Elasticsearch health
curl http://elasticsearch:9200/_cluster/health
```

## Backup & Recovery

### Database Backups

```bash
# Automated RDS backups
# - Retention: 30 days
# - Multi-AZ enabled

# Manual backup
pg_dump -U user dbname > backup.sql

# Restore
psql -U user dbname < backup.sql
```

### S3 Backups

```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-bucket \
  --versioning-configuration Status=Enabled

# Enable replication
# Configure cross-region replication in AWS Console
```

### Code Backups

```bash
# Git repository
# Push to GitHub/GitLab/Bitbucket
git push origin main

# Docker images
# Push to ECR/Docker Hub
docker push your-registry/ecommerce-backend
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and push
        run: |
          docker build -t backend ./backend
          docker tag backend ${{ secrets.ECR_REGISTRY }}/backend:latest
          aws ecr get-login-password | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
          docker push ${{ secrets.ECR_REGISTRY }}/backend:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster production --service backend --force-new-deployment
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   psql -U user -h host -d dbname
   ```

2. **Redis Connection Error**
   ```bash
   # Check Redis status
   redis-cli ping
   
   # Restart Redis
   sudo systemctl restart redis-server
   ```

3. **Elasticsearch Health Red**
   ```bash
   # Check cluster health
   curl http://elasticsearch:9200/_cluster/health
   
   # Allocate shards
   curl -X POST http://elasticsearch:9200/_cluster/reroute?retry_failed=true
   ```

4. **High Memory Usage**
   ```bash
   # Identify memory leaks
   node --inspect index.js
   
   # Use Chrome DevTools for profiling
   chrome://inspect
   ```

## Performance Tuning

### Database Optimization

```sql
-- Enable query logging
SET log_min_duration_statement = 100;

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM products;

-- Create missing indexes
CREATE INDEX idx_product_vendor ON products(vendor_id);
CREATE INDEX idx_order_user ON orders(user_id);
```

### Application Optimization

```javascript
// Enable gzip compression
app.use(compression());

// Connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
});

// Cache frequently accessed data
const cache = new NodeCache({ stdTTL: 600 });
```

## Security Checklist

- [x] SSL/TLS enabled (HTTPS only)
- [x] Environment variables protected
- [x] Database credentials rotated
- [x] API rate limiting enabled
- [x] CORS configured
- [x] Security headers enabled (Helmet)
- [x] SQL injection prevention (Prisma)
- [x] XSS protection enabled
- [x] CSRF tokens implemented
- [x] Regular security audits scheduled
- [x] WAF rules configured
- [x] DDoS protection enabled

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check disk space
- Verify backups

**Weekly:**
- Review performance metrics
- Check security alerts
- Update dependencies

**Monthly:**
- Database optimization
- Security audit
- Capacity planning

**Quarterly:**
- Disaster recovery drill
- Performance benchmarking
- Architecture review

## Support & Resources

- **AWS Documentation**: https://docs.aws.amazon.com
- **DigitalOcean Guides**: https://docs.digitalocean.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **Redis Docs**: https://redis.io/documentation
- **Elasticsearch Docs**: https://www.elastic.co/guide

---

**Last Updated**: November 23, 2026
**Version**: 1.0.0
