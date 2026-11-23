# API Documentation

Base URL: `http://localhost:3001/api`

## Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Products](#products)
- [Cart](#cart)
- [Orders](#orders)
- [Payments](#payments)
- [Reviews](#reviews)
- [Coupons](#coupons)
- [Vendors](#vendors)
- [Admin](#admin)
- [Categories](#categories)

## Common Headers

All authenticated requests require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Authentication

### Register User
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login
Authenticate and receive access token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Refresh Token
Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Logout
Invalidate refresh token.

**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Forgot Password
Request password reset email.

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

### Reset Password
Reset password using token from email.

**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!"
}
```

**Response:** `200 OK`

---

## Users

### Get Current User
Get authenticated user profile.

**Endpoint:** `GET /users/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "phone": "+1234567890",
    "avatar": "https://s3.../avatar.jpg",
    "verified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update Profile
Update user profile information.

**Endpoint:** `PUT /users/me`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:** `200 OK`

### Change Password
Change user password.

**Endpoint:** `PUT /users/me/password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response:** `200 OK`

### Upload Avatar
Upload user profile picture.

**Endpoint:** `POST /users/me/avatar`

**Headers:** 
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:** FormData with `avatar` file

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://s3.../avatar.jpg"
  }
}
```

---

## Products

### Search Products
Search and filter products with Elasticsearch.

**Endpoint:** `GET /products`

**Query Parameters:**
- `q` (string): Search query
- `category` (string): Category slug
- `vendor` (uuid): Vendor ID
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `rating` (number): Minimum rating (1-5)
- `sort` (string): Sort field (`price`, `rating`, `created`, `name`)
- `order` (string): Sort order (`asc`, `desc`)
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20, max: 100)

**Example:** `GET /products?q=laptop&minPrice=500&maxPrice=2000&sort=price&order=asc&page=1`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "MacBook Pro 16",
        "slug": "macbook-pro-16",
        "description": "Powerful laptop...",
        "price": 2499.00,
        "comparePrice": 2799.00,
        "images": ["https://s3.../image1.jpg"],
        "rating": 4.8,
        "reviewCount": 128,
        "inventory": 15,
        "vendor": {
          "id": "uuid",
          "businessName": "Tech Store",
          "rating": 4.9
        },
        "categories": [
          {
            "id": "uuid",
            "name": "Laptops",
            "slug": "laptops"
          }
        ]
      }
    ],
    "pagination": {
      "total": 156,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

### Get Product
Get single product details.

**Endpoint:** `GET /products/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "MacBook Pro 16",
    "slug": "macbook-pro-16",
    "description": "Powerful laptop with M3 chip...",
    "price": 2499.00,
    "comparePrice": 2799.00,
    "sku": "MBP16-M3-512",
    "images": ["https://s3.../image1.jpg", "https://s3.../image2.jpg"],
    "rating": 4.8,
    "reviewCount": 128,
    "inventory": 15,
    "status": "ACTIVE",
    "vendor": {
      "id": "uuid",
      "businessName": "Tech Store",
      "rating": 4.9,
      "totalSales": 1250
    },
    "categories": [
      {
        "id": "uuid",
        "name": "Laptops",
        "slug": "laptops"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Create Product (Vendor Only)
Create a new product.

**Endpoint:** `POST /products`

**Headers:** `Authorization: Bearer <vendor_token>`

**Request Body:**
```json
{
  "name": "MacBook Pro 16",
  "description": "Powerful laptop...",
  "price": 2499.00,
  "comparePrice": 2799.00,
  "sku": "MBP16-M3-512",
  "inventory": 15,
  "categoryIds": ["uuid1", "uuid2"],
  "images": ["https://s3.../image1.jpg"]
}
```

**Response:** `201 Created`

### Update Product (Vendor Only)
Update product details.

**Endpoint:** `PUT /products/:id`

**Headers:** `Authorization: Bearer <vendor_token>`

**Request Body:** Same as Create Product

**Response:** `200 OK`

### Delete Product (Vendor Only)
Delete a product (soft delete - set status to ARCHIVED).

**Endpoint:** `DELETE /products/:id`

**Headers:** `Authorization: Bearer <vendor_token>`

**Response:** `200 OK`

### Upload Product Images (Vendor Only)
Upload product images to S3.

**Endpoint:** `POST /products/:id/images`

**Headers:** 
```
Authorization: Bearer <vendor_token>
Content-Type: multipart/form-data
```

**Request Body:** FormData with multiple `images` files (max 5)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "imageUrls": [
      "https://s3.../product1.jpg",
      "https://s3.../product2.jpg"
    ]
  }
}
```

---

## Cart

### Get Cart
Get user's shopping cart (from Redis).

**Endpoint:** `GET /cart`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "uuid",
        "name": "MacBook Pro 16",
        "price": 2499.00,
        "quantity": 1,
        "image": "https://s3.../image.jpg",
        "vendorId": "uuid",
        "vendorName": "Tech Store"
      }
    ],
    "subtotal": 2499.00,
    "itemCount": 1
  }
}
```

### Add to Cart
Add product to cart.

**Endpoint:** `POST /cart/items`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "productId": "uuid",
  "quantity": 1
}
```

**Response:** `200 OK`

### Update Cart Item
Update quantity of cart item.

**Endpoint:** `PUT /cart/items/:productId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "quantity": 2
}
```

**Response:** `200 OK`

### Remove from Cart
Remove item from cart.

**Endpoint:** `DELETE /cart/items/:productId`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Clear Cart
Remove all items from cart.

**Endpoint:** `DELETE /cart`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Orders

### Create Order
Create new order from cart.

**Endpoint:** `POST /orders`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "billingAddress": {
    "fullName": "John Doe",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "couponCode": "SAVE10",
  "notes": "Please deliver in the morning"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNumber": "ORD-2024-00001",
    "total": 2499.00,
    "status": "PLACED"
  }
}
```

### Get Orders
Get user's order history.

**Endpoint:** `GET /orders`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (string): Filter by status
- `page` (number): Page number
- `limit` (number): Results per page

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-2024-00001",
        "status": "SHIPPED",
        "total": 2499.00,
        "itemCount": 1,
        "trackingNumber": "TRACK123",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### Get Order Details
Get specific order details.

**Endpoint:** `GET /orders/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-2024-00001",
    "status": "SHIPPED",
    "subtotal": 2499.00,
    "discount": 249.90,
    "tax": 0.00,
    "shipping": 0.00,
    "total": 2249.10,
    "shippingAddress": { ... },
    "billingAddress": { ... },
    "trackingNumber": "TRACK123",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "name": "MacBook Pro 16",
        "price": 2499.00,
        "quantity": 1,
        "total": 2499.00,
        "vendor": {
          "id": "uuid",
          "businessName": "Tech Store"
        }
      }
    ],
    "payment": {
      "id": "uuid",
      "amount": 2249.10,
      "status": "SUCCEEDED",
      "paymentMethod": "card"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "shippedAt": "2024-01-02T00:00:00Z"
  }
}
```

### Download Invoice
Download order invoice as PDF.

**Endpoint:** `GET /orders/:id/invoice`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK` (PDF file)

### Cancel Order
Cancel an order (only if not yet packed).

**Endpoint:** `POST /orders/:id/cancel`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Payments

### Create Payment Intent
Create Stripe PaymentIntent for order.

**Endpoint:** `POST /payments/intent`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "orderId": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "amount": 2249.10
  }
}
```

### Confirm Payment
Confirm payment after successful Stripe charge.

**Endpoint:** `POST /payments/confirm`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "orderId": "uuid",
  "paymentIntentId": "pi_xxx"
}
```

**Response:** `200 OK`

### Webhook Handler (Internal)
Handle Stripe webhooks for payment events.

**Endpoint:** `POST /payments/webhook`

**Headers:** `Stripe-Signature: <signature>`

**Request Body:** Stripe event payload

**Response:** `200 OK`

---

## Reviews

### Get Product Reviews
Get reviews for a product.

**Endpoint:** `GET /products/:productId/reviews`

**Query Parameters:**
- `rating` (number): Filter by rating (1-5)
- `page` (number): Page number
- `limit` (number): Results per page

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "title": "Excellent product!",
        "comment": "Very satisfied with this purchase...",
        "images": ["https://s3.../review1.jpg"],
        "helpfulCount": 12,
        "verifiedPurchase": true,
        "user": {
          "firstName": "John",
          "lastName": "D.",
          "avatar": "https://s3.../avatar.jpg"
        },
        "vendorResponse": "Thank you for your feedback!",
        "createdAt": "2024-01-15T00:00:00Z"
      }
    ],
    "summary": {
      "averageRating": 4.8,
      "totalReviews": 128,
      "distribution": {
        "5": 95,
        "4": 25,
        "3": 5,
        "2": 2,
        "1": 1
      }
    },
    "pagination": {
      "total": 128,
      "page": 1,
      "limit": 20,
      "pages": 7
    }
  }
}
```

### Create Review
Submit a product review (requires purchase).

**Endpoint:** `POST /products/:productId/reviews`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "orderId": "uuid",
  "rating": 5,
  "title": "Excellent product!",
  "comment": "Very satisfied with this purchase...",
  "images": ["https://s3.../review1.jpg"]
}
```

**Response:** `201 Created`

### Mark Review Helpful
Mark a review as helpful.

**Endpoint:** `POST /reviews/:id/helpful`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Vendor Response (Vendor Only)
Respond to a product review.

**Endpoint:** `POST /reviews/:id/response`

**Headers:** `Authorization: Bearer <vendor_token>`

**Request Body:**
```json
{
  "response": "Thank you for your feedback!"
}
```

**Response:** `200 OK`

---

## Coupons

### Validate Coupon
Check if coupon code is valid.

**Endpoint:** `POST /coupons/validate`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "code": "SAVE10",
  "subtotal": 2499.00
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "valid": true,
    "coupon": {
      "id": "uuid",
      "code": "SAVE10",
      "type": "PERCENTAGE",
      "value": 10.00,
      "discount": 249.90
    }
  }
}
```

### Get Available Coupons
Get list of active coupons (admin/vendor).

**Endpoint:** `GET /coupons`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Create Coupon (Admin Only)
Create a new coupon.

**Endpoint:** `POST /coupons`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "code": "SAVE10",
  "type": "PERCENTAGE",
  "value": 10.00,
  "minPurchase": 100.00,
  "maxDiscount": 500.00,
  "usageLimit": 1000,
  "perUserLimit": 1,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z"
}
```

**Response:** `201 Created`

---

## Vendors

### Get Vendor Profile
Get vendor public profile.

**Endpoint:** `GET /vendors/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessName": "Tech Store",
    "description": "Premium tech products...",
    "logo": "https://s3.../logo.jpg",
    "banner": "https://s3.../banner.jpg",
    "rating": 4.9,
    "totalSales": 1250,
    "verified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Get Vendor Products
Get products from a specific vendor.

**Endpoint:** `GET /vendors/:id/products`

**Query Parameters:** Same as product search

**Response:** `200 OK` (same format as product search)

### Create Vendor Profile
Complete vendor onboarding.

**Endpoint:** `POST /vendors/profile`

**Headers:** `Authorization: Bearer <vendor_token>`

**Request Body:**
```json
{
  "businessName": "Tech Store",
  "description": "Premium tech products...",
  "phone": "+1234567890",
  "businessAddress": {
    "street": "456 Business Ave",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  }
}
```

**Response:** `201 Created`

### Update Vendor Profile
Update vendor information.

**Endpoint:** `PUT /vendors/profile`

**Headers:** `Authorization: Bearer <vendor_token>`

**Request Body:** Same as create

**Response:** `200 OK`

### Connect Stripe Account
Initialize Stripe Connect onboarding.

**Endpoint:** `POST /vendors/stripe/connect`

**Headers:** `Authorization: Bearer <vendor_token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accountLinkUrl": "https://connect.stripe.com/..."
  }
}
```

### Get Vendor Orders
Get orders containing vendor's products.

**Endpoint:** `GET /vendors/orders`

**Headers:** `Authorization: Bearer <vendor_token>`

**Query Parameters:**
- `status` (string): Filter by order item status
- `page` (number): Page number
- `limit` (number): Results per page

**Response:** `200 OK`

### Update Order Item Status
Update status of vendor's order item.

**Endpoint:** `PUT /vendors/orders/:orderId/items/:itemId`

**Headers:** `Authorization: Bearer <vendor_token>`

**Request Body:**
```json
{
  "status": "PACKED",
  "trackingNumber": "TRACK123"
}
```

**Response:** `200 OK`

### Vendor Analytics
Get vendor sales analytics.

**Endpoint:** `GET /vendors/analytics`

**Headers:** `Authorization: Bearer <vendor_token>`

**Query Parameters:**
- `startDate` (string): Start date (ISO 8601)
- `endDate` (string): End date (ISO 8601)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 125000.00,
      "commission": 12500.00,
      "net": 112500.00
    },
    "orders": {
      "total": 523,
      "completed": 500,
      "cancelled": 23
    },
    "products": {
      "total": 45,
      "active": 42,
      "outOfStock": 3
    },
    "topProducts": [
      {
        "id": "uuid",
        "name": "MacBook Pro 16",
        "sold": 125,
        "revenue": 312375.00
      }
    ]
  }
}
```

---

## Admin

### Get All Users
Get list of all users.

**Endpoint:** `GET /admin/users`

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `role` (string): Filter by role
- `verified` (boolean): Filter by verification status
- `page` (number): Page number
- `limit` (number): Results per page

**Response:** `200 OK`

### Ban/Unban User
Toggle user active status.

**Endpoint:** `PUT /admin/users/:id/status`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "active": false
}
```

**Response:** `200 OK`

### Approve Vendor
Verify vendor account.

**Endpoint:** `PUT /admin/vendors/:id/verify`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "verified": true
}
```

**Response:** `200 OK`

### Platform Analytics
Get platform-wide analytics.

**Endpoint:** `GET /admin/analytics`

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `startDate` (string): Start date
- `endDate` (string): End date

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 1500000.00,
      "commission": 150000.00
    },
    "orders": {
      "total": 5234,
      "completed": 5000,
      "cancelled": 234
    },
    "users": {
      "total": 10234,
      "customers": 10000,
      "vendors": 234,
      "newThisMonth": 523
    },
    "products": {
      "total": 12345,
      "active": 11000
    },
    "topVendors": [
      {
        "id": "uuid",
        "businessName": "Tech Store",
        "revenue": 125000.00,
        "orders": 523
      }
    ],
    "revenueChart": [
      {
        "date": "2024-01-01",
        "revenue": 50000.00
      }
    ]
  }
}
```

### Manage Coupons
See Coupons section - admin has full CRUD access.

---

## Categories

### Get All Categories
Get category tree.

**Endpoint:** `GET /categories`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "image": "https://s3.../electronics.jpg",
      "children": [
        {
          "id": "uuid",
          "name": "Laptops",
          "slug": "laptops",
          "productCount": 345
        }
      ]
    }
  ]
}
```

### Create Category (Admin Only)
Create a new category.

**Endpoint:** `POST /categories`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "Laptops",
  "slug": "laptops",
  "description": "Laptop computers",
  "parentId": "parent-uuid"
}
```

**Response:** `201 Created`

---

## Rate Limiting

API endpoints are rate-limited based on user role:

| Role      | Rate Limit          |
|-----------|---------------------|
| Anonymous | 100 req/15 min      |
| Customer  | 500 req/15 min      |
| Vendor    | 1000 req/15 min     |
| Admin     | Unlimited           |

Specific endpoints have additional limits:
- Login: 5 attempts/15 min
- Password Reset: 3 attempts/hour
- Image Upload: 10 uploads/hour

## Pagination

All list endpoints support pagination with these query parameters:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

Pagination response format:
```json
{
  "pagination": {
    "total": 1000,
    "page": 1,
    "limit": 20,
    "pages": 50
  }
}
```

## Filtering & Sorting

Most list endpoints support:
- Filtering: Use query parameters matching field names
- Sorting: `sort` parameter with field name, `order` parameter with `asc` or `desc`

Example: `/products?category=laptops&minPrice=500&sort=price&order=asc`

## Error Codes

| Code | Description                     |
|------|---------------------------------|
| E001 | Invalid credentials             |
| E002 | Email already exists            |
| E003 | Invalid token                   |
| E004 | Resource not found              |
| E005 | Insufficient permissions        |
| E006 | Validation error                |
| E007 | Out of stock                    |
| E008 | Invalid coupon                  |
| E009 | Payment failed                  |
| E010 | Order cannot be cancelled       |

## Webhooks

The platform sends webhooks for various events (configured per vendor/admin):

### Order Events
- `order.created`
- `order.paid`
- `order.shipped`
- `order.delivered`
- `order.cancelled`

### Payment Events
- `payment.succeeded`
- `payment.failed`
- `payout.created`
- `payout.paid`

Webhook payload format:
```json
{
  "event": "order.paid",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": { ... }
}
```
