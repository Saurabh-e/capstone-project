# Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│    Users    │◄────────│  VendorProfiles  │         │  Categories  │
│             │ 1     1 │                  │         │              │
│ id (PK)     │         │ id (PK)          │         │ id (PK)      │
│ email       │         │ user_id (FK)     │         │ name         │
│ password    │         │ business_name    │         │ slug         │
│ role        │         │ stripe_account_id│         │ parent_id    │
│ first_name  │         │ commission_rate  │         └──────────────┘
│ last_name   │         │ verified         │                │
│ created_at  │         │ created_at       │                │
└─────────────┘         └──────────────────┘                │
       │                        │                            │
       │ 1                      │ 1                          │
       │                        │                            │
       │ *                      │ *                          │ *
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Orders    │         │    Products      │◄────────│ProductCategory│
│             │         │                  │ *     * │              │
│ id (PK)     │         │ id (PK)          │         │ product_id   │
│ user_id (FK)│         │ vendor_id (FK)   │         │ category_id  │
│ status      │         │ name             │         └──────────────┘
│ total       │         │ description      │
│ subtotal    │         │ price            │
│ discount    │         │ compare_price    │
│ created_at  │         │ inventory        │
└─────────────┘         │ images           │
       │                │ sku              │
       │ 1              │ rating           │
       │                │ review_count     │
       │ *              │ created_at       │
┌─────────────┐         └──────────────────┘
│ OrderItems  │                 │
│             │                 │ 1
│ id (PK)     │                 │
│ order_id(FK)│                 │ *
│ product_id  │         ┌──────────────────┐
│ vendor_id   │         │    Reviews       │
│ quantity    │         │                  │
│ price       │         │ id (PK)          │
│ total       │         │ product_id (FK)  │
└─────────────┘         │ user_id (FK)     │
       │                │ rating           │
       │ 1              │ comment          │
       │                │ images           │
       │ 1              │ helpful_count    │
┌─────────────┐         │ created_at       │
│  Payments   │         └──────────────────┘
│             │
│ id (PK)     │         ┌──────────────────┐
│ order_id(FK)│         │    Coupons       │
│ stripe_id   │         │                  │
│ amount      │         │ id (PK)          │
│ status      │         │ code             │
│ vendor_split│         │ type             │
│ created_at  │         │ value            │
└─────────────┘         │ min_purchase     │
                        │ max_discount     │
┌─────────────┐         │ usage_limit      │
│  Addresses  │         │ used_count       │
│             │         │ valid_from       │
│ id (PK)     │         │ valid_until      │
│ user_id (FK)│         │ created_by (FK)  │
│ type        │         │ created_at       │
│ street      │         └──────────────────┘
│ city        │
│ state       │         ┌──────────────────┐
│ zip         │         │  OrderCoupons    │
│ country     │         │                  │
│ is_default  │         │ order_id (FK)    │
└─────────────┘         │ coupon_id (FK)   │
                        │ discount_applied │
                        └──────────────────┘
```

## Table Specifications

### Users Table
Primary table for all user accounts (customers, vendors, admins).

| Column      | Type         | Constraints                    | Description                      |
|-------------|--------------|--------------------------------|----------------------------------|
| id          | UUID         | PRIMARY KEY, DEFAULT uuid()    | Unique user identifier           |
| email       | VARCHAR(255) | UNIQUE, NOT NULL               | User email address               |
| password    | VARCHAR(255) | NOT NULL                       | Hashed password (bcrypt)         |
| role        | ENUM         | NOT NULL, DEFAULT 'CUSTOMER'   | CUSTOMER, VENDOR, ADMIN          |
| first_name  | VARCHAR(100) | NOT NULL                       | User's first name                |
| last_name   | VARCHAR(100) | NOT NULL                       | User's last name                 |
| phone       | VARCHAR(20)  | NULL                           | Contact phone number             |
| avatar      | TEXT         | NULL                           | Profile image URL                |
| verified    | BOOLEAN      | DEFAULT false                  | Email verification status        |
| active      | BOOLEAN      | DEFAULT true                   | Account active status            |
| created_at  | TIMESTAMP    | DEFAULT NOW()                  | Account creation timestamp       |
| updated_at  | TIMESTAMP    | DEFAULT NOW()                  | Last update timestamp            |

**Indexes:**
- PRIMARY: id
- UNIQUE: email
- INDEX: role, created_at

### VendorProfiles Table
Extended information for vendor accounts.

| Column              | Type          | Constraints              | Description                        |
|---------------------|---------------|--------------------------|------------------------------------|
| id                  | UUID          | PRIMARY KEY              | Unique vendor profile ID           |
| user_id             | UUID          | FOREIGN KEY, UNIQUE      | Reference to Users table           |
| business_name       | VARCHAR(255)  | NOT NULL                 | Business/shop name                 |
| description         | TEXT          | NULL                     | Vendor bio/description             |
| logo                | TEXT          | NULL                     | Business logo URL                  |
| banner              | TEXT          | NULL                     | Shop banner image URL              |
| stripe_account_id   | VARCHAR(255)  | UNIQUE, NULL             | Stripe Connect account ID          |
| commission_rate     | DECIMAL(5,2)  | DEFAULT 10.00            | Platform commission (%)            |
| verified            | BOOLEAN       | DEFAULT false            | Admin verification status          |
| rating              | DECIMAL(3,2)  | DEFAULT 0.00             | Average vendor rating              |
| total_sales         | INTEGER       | DEFAULT 0                | Total completed orders             |
| created_at          | TIMESTAMP     | DEFAULT NOW()            | Profile creation timestamp         |
| updated_at          | TIMESTAMP     | DEFAULT NOW()            | Last update timestamp              |

**Indexes:**
- PRIMARY: id
- UNIQUE: user_id, stripe_account_id
- INDEX: verified, rating

### Categories Table
Product categorization with hierarchical support.

| Column      | Type         | Constraints              | Description                      |
|-------------|--------------|--------------------------|----------------------------------|
| id          | UUID         | PRIMARY KEY              | Unique category ID               |
| name        | VARCHAR(100) | NOT NULL                 | Category name                    |
| slug        | VARCHAR(100) | UNIQUE, NOT NULL         | URL-friendly slug                |
| description | TEXT         | NULL                     | Category description             |
| image       | TEXT         | NULL                     | Category image URL               |
| parent_id   | UUID         | FOREIGN KEY, NULL        | Parent category (for hierarchy)  |
| order       | INTEGER      | DEFAULT 0                | Display order                    |
| active      | BOOLEAN      | DEFAULT true             | Category active status           |
| created_at  | TIMESTAMP    | DEFAULT NOW()            | Creation timestamp               |

**Indexes:**
- PRIMARY: id
- UNIQUE: slug
- INDEX: parent_id, active, order

### Products Table
Core product information managed by vendors.

| Column         | Type          | Constraints              | Description                        |
|----------------|---------------|--------------------------|------------------------------------|
| id             | UUID          | PRIMARY KEY              | Unique product ID                  |
| vendor_id      | UUID          | FOREIGN KEY, NOT NULL    | Reference to VendorProfiles        |
| name           | VARCHAR(255)  | NOT NULL                 | Product name                       |
| slug           | VARCHAR(255)  | UNIQUE, NOT NULL         | URL-friendly slug                  |
| description    | TEXT          | NULL                     | Product description                |
| price          | DECIMAL(10,2) | NOT NULL                 | Current selling price              |
| compare_price  | DECIMAL(10,2) | NULL                     | Original/compare price             |
| cost           | DECIMAL(10,2) | NULL                     | Product cost (for analytics)       |
| sku            | VARCHAR(100)  | NULL                     | Stock keeping unit                 |
| barcode        | VARCHAR(100)  | NULL                     | Product barcode                    |
| inventory      | INTEGER       | DEFAULT 0                | Available quantity                 |
| track_inventory| BOOLEAN       | DEFAULT true             | Enable inventory tracking          |
| images         | JSON          | DEFAULT []               | Array of image URLs                |
| rating         | DECIMAL(3,2)  | DEFAULT 0.00             | Average rating                     |
| review_count   | INTEGER       | DEFAULT 0                | Number of reviews                  |
| status         | ENUM          | DEFAULT 'DRAFT'          | DRAFT, ACTIVE, ARCHIVED            |
| featured       | BOOLEAN       | DEFAULT false            | Featured product flag              |
| created_at     | TIMESTAMP     | DEFAULT NOW()            | Creation timestamp                 |
| updated_at     | TIMESTAMP     | DEFAULT NOW()            | Last update timestamp              |

**Indexes:**
- PRIMARY: id
- UNIQUE: slug
- INDEX: vendor_id, status, featured, rating, created_at
- FULLTEXT: name, description

### ProductCategories Table
Many-to-many relationship between products and categories.

| Column      | Type      | Constraints              | Description                      |
|-------------|-----------|--------------------------|----------------------------------|
| product_id  | UUID      | FOREIGN KEY, NOT NULL    | Reference to Products            |
| category_id | UUID      | FOREIGN KEY, NOT NULL    | Reference to Categories          |

**Indexes:**
- PRIMARY: (product_id, category_id)
- INDEX: category_id

### Orders Table
Customer orders with status tracking.

| Column           | Type          | Constraints              | Description                        |
|------------------|---------------|--------------------------|------------------------------------|
| id               | UUID          | PRIMARY KEY              | Unique order ID                    |
| order_number     | VARCHAR(50)   | UNIQUE, NOT NULL         | Human-readable order number        |
| user_id          | UUID          | FOREIGN KEY, NOT NULL    | Reference to Users                 |
| status           | ENUM          | DEFAULT 'PLACED'         | Order status (see below)           |
| subtotal         | DECIMAL(10,2) | NOT NULL                 | Sum of item prices                 |
| discount         | DECIMAL(10,2) | DEFAULT 0.00             | Total discount applied             |
| tax              | DECIMAL(10,2) | DEFAULT 0.00             | Tax amount                         |
| shipping         | DECIMAL(10,2) | DEFAULT 0.00             | Shipping cost                      |
| total            | DECIMAL(10,2) | NOT NULL                 | Final order total                  |
| shipping_address | JSON          | NOT NULL                 | Shipping address details           |
| billing_address  | JSON          | NOT NULL                 | Billing address details            |
| notes            | TEXT          | NULL                     | Customer notes                     |
| tracking_number  | VARCHAR(100)  | NULL                     | Shipment tracking number           |
| shipped_at       | TIMESTAMP     | NULL                     | Shipment timestamp                 |
| delivered_at     | TIMESTAMP     | NULL                     | Delivery timestamp                 |
| cancelled_at     | TIMESTAMP     | NULL                     | Cancellation timestamp             |
| created_at       | TIMESTAMP     | DEFAULT NOW()            | Order creation timestamp           |
| updated_at       | TIMESTAMP     | DEFAULT NOW()            | Last update timestamp              |

**Order Status Flow:**
```
PLACED → PAID → PROCESSING → PACKED → SHIPPED → DELIVERED
                     ↓
                 CANCELLED (can happen before PACKED)
                 REFUNDED (after payment issues)
```

**Indexes:**
- PRIMARY: id
- UNIQUE: order_number
- INDEX: user_id, status, created_at

### OrderItems Table
Individual items within an order.

| Column      | Type          | Constraints              | Description                        |
|-------------|---------------|--------------------------|------------------------------------|
| id          | UUID          | PRIMARY KEY              | Unique order item ID               |
| order_id    | UUID          | FOREIGN KEY, NOT NULL    | Reference to Orders                |
| product_id  | UUID          | FOREIGN KEY, NOT NULL    | Reference to Products              |
| vendor_id   | UUID          | FOREIGN KEY, NOT NULL    | Reference to VendorProfiles        |
| name        | VARCHAR(255)  | NOT NULL                 | Product name snapshot              |
| price       | DECIMAL(10,2) | NOT NULL                 | Price at time of order             |
| quantity    | INTEGER       | NOT NULL                 | Quantity ordered                   |
| total       | DECIMAL(10,2) | NOT NULL                 | Line item total (price * quantity) |
| status      | ENUM          | DEFAULT 'PENDING'        | Item-level status                  |
| created_at  | TIMESTAMP     | DEFAULT NOW()            | Creation timestamp                 |

**Indexes:**
- PRIMARY: id
- INDEX: order_id, product_id, vendor_id

### Payments Table
Payment transaction records.

| Column              | Type          | Constraints              | Description                        |
|---------------------|---------------|--------------------------|------------------------------------|
| id                  | UUID          | PRIMARY KEY              | Unique payment ID                  |
| order_id            | UUID          | FOREIGN KEY, UNIQUE      | Reference to Orders                |
| stripe_payment_id   | VARCHAR(255)  | NULL                     | Stripe PaymentIntent ID            |
| amount              | DECIMAL(10,2) | NOT NULL                 | Total payment amount               |
| currency            | VARCHAR(3)    | DEFAULT 'USD'            | Currency code (ISO 4217)           |
| status              | ENUM          | DEFAULT 'PENDING'        | PENDING, SUCCEEDED, FAILED         |
| payment_method      | VARCHAR(50)   | NULL                     | card, bank_transfer, etc.          |
| vendor_splits       | JSON          | NULL                     | Vendor payment breakdown           |
| metadata            | JSON          | NULL                     | Additional payment data            |
| created_at          | TIMESTAMP     | DEFAULT NOW()            | Payment creation timestamp         |
| updated_at          | TIMESTAMP     | DEFAULT NOW()            | Last update timestamp              |

**Indexes:**
- PRIMARY: id
- UNIQUE: order_id
- INDEX: stripe_payment_id, status

### Reviews Table
Product reviews and ratings.

| Column         | Type         | Constraints              | Description                        |
|----------------|--------------|--------------------------|-------------------------------------|
| id             | UUID         | PRIMARY KEY              | Unique review ID                    |
| product_id     | UUID         | FOREIGN KEY, NOT NULL    | Reference to Products               |
| user_id        | UUID         | FOREIGN KEY, NOT NULL    | Reference to Users                  |
| order_id       | UUID         | FOREIGN KEY, NULL        | Reference to Orders (verified buy)  |
| rating         | INTEGER      | NOT NULL, CHECK(1-5)     | Rating (1-5 stars)                  |
| title          | VARCHAR(255) | NULL                     | Review title                        |
| comment        | TEXT         | NULL                     | Review text                         |
| images         | JSON         | DEFAULT []               | Review images                       |
| helpful_count  | INTEGER      | DEFAULT 0                | Number of helpful votes             |
| verified_purchase | BOOLEAN   | DEFAULT false            | Verified purchase badge             |
| vendor_response| TEXT         | NULL                     | Vendor's response                   |
| responded_at   | TIMESTAMP    | NULL                     | Vendor response timestamp           |
| created_at     | TIMESTAMP    | DEFAULT NOW()            | Review creation timestamp           |
| updated_at     | TIMESTAMP    | DEFAULT NOW()            | Last update timestamp               |

**Indexes:**
- PRIMARY: id
- UNIQUE: (product_id, user_id) - One review per product per user
- INDEX: product_id, rating, created_at

### Coupons Table
Discount coupons and promotional codes.

| Column        | Type          | Constraints              | Description                        |
|---------------|---------------|--------------------------|------------------------------------|
| id            | UUID          | PRIMARY KEY              | Unique coupon ID                   |
| code          | VARCHAR(50)   | UNIQUE, NOT NULL         | Coupon code (uppercase)            |
| type          | ENUM          | NOT NULL                 | PERCENTAGE, FIXED_AMOUNT           |
| value         | DECIMAL(10,2) | NOT NULL                 | Discount value                     |
| min_purchase  | DECIMAL(10,2) | DEFAULT 0.00             | Minimum purchase amount            |
| max_discount  | DECIMAL(10,2) | NULL                     | Maximum discount cap               |
| usage_limit   | INTEGER       | NULL                     | Total usage limit (NULL = unlimited)|
| used_count    | INTEGER       | DEFAULT 0                | Times used                         |
| per_user_limit| INTEGER       | DEFAULT 1                | Usage limit per user               |
| valid_from    | TIMESTAMP     | NOT NULL                 | Coupon start date                  |
| valid_until   | TIMESTAMP     | NOT NULL                 | Coupon expiry date                 |
| active        | BOOLEAN       | DEFAULT true             | Coupon active status               |
| created_by    | UUID          | FOREIGN KEY, NULL        | Admin/Vendor who created           |
| created_at    | TIMESTAMP     | DEFAULT NOW()            | Creation timestamp                 |

**Indexes:**
- PRIMARY: id
- UNIQUE: code
- INDEX: active, valid_from, valid_until

### OrderCoupons Table
Track coupon usage per order.

| Column           | Type          | Constraints              | Description                        |
|------------------|---------------|--------------------------|------------------------------------|
| id               | UUID          | PRIMARY KEY              | Unique record ID                   |
| order_id         | UUID          | FOREIGN KEY, NOT NULL    | Reference to Orders                |
| coupon_id        | UUID          | FOREIGN KEY, NOT NULL    | Reference to Coupons               |
| discount_applied | DECIMAL(10,2) | NOT NULL                 | Actual discount amount             |
| created_at       | TIMESTAMP     | DEFAULT NOW()            | Application timestamp              |

**Indexes:**
- PRIMARY: id
- INDEX: order_id, coupon_id

### Addresses Table
Stored addresses for users.

| Column      | Type         | Constraints              | Description                      |
|-------------|--------------|--------------------------|----------------------------------|
| id          | UUID         | PRIMARY KEY              | Unique address ID                |
| user_id     | UUID         | FOREIGN KEY, NOT NULL    | Reference to Users               |
| type        | ENUM         | DEFAULT 'SHIPPING'       | SHIPPING, BILLING, BOTH          |
| full_name   | VARCHAR(100) | NOT NULL                 | Recipient name                   |
| phone       | VARCHAR(20)  | NULL                     | Contact phone                    |
| street      | VARCHAR(255) | NOT NULL                 | Street address                   |
| city        | VARCHAR(100) | NOT NULL                 | City name                        |
| state       | VARCHAR(100) | NOT NULL                 | State/province                   |
| zip         | VARCHAR(20)  | NOT NULL                 | Postal code                      |
| country     | VARCHAR(100) | NOT NULL                 | Country name                     |
| is_default  | BOOLEAN      | DEFAULT false            | Default address flag             |
| created_at  | TIMESTAMP    | DEFAULT NOW()            | Creation timestamp               |
| updated_at  | TIMESTAMP    | DEFAULT NOW()            | Last update timestamp            |

**Indexes:**
- PRIMARY: id
- INDEX: user_id, is_default

## Database Constraints

### Foreign Key Constraints
All foreign key relationships enforce referential integrity with appropriate cascading:
- `ON DELETE CASCADE`: OrderItems, OrderCoupons, ProductCategories
- `ON DELETE SET NULL`: Reviews (when user deleted), Coupons (when creator deleted)
- `ON DELETE RESTRICT`: Products (prevent vendor deletion with active products)

### Check Constraints
- Review rating: CHECK (rating >= 1 AND rating <= 5)
- Prices: CHECK (price >= 0)
- Inventory: CHECK (inventory >= 0)
- Commission rate: CHECK (commission_rate >= 0 AND commission_rate <= 100)

### Triggers
1. **Update Product Rating**: Automatically recalculate product rating when reviews are added/updated
2. **Update Vendor Stats**: Update vendor total_sales when order is delivered
3. **Inventory Decrement**: Reduce inventory when order is placed
4. **Inventory Restore**: Restore inventory on order cancellation
5. **Updated At**: Auto-update updated_at timestamp on row changes

## Optimization Strategies

### Indexing Strategy
- Primary keys on all tables (clustered index)
- Foreign keys indexed for join performance
- Composite indexes for common query patterns
- Partial indexes on filtered queries (e.g., active products)

### Partitioning
Consider partitioning for high-volume tables:
- Orders table: Partition by created_at (monthly/yearly)
- OrderItems table: Partition by created_at
- Reviews table: Partition by created_at

### Query Optimization
- Use prepared statements to prevent SQL injection
- Implement pagination (LIMIT/OFFSET)
- Eager loading for related data
- Database connection pooling
- Query result caching in Redis

### Data Archival
- Archive old orders (> 2 years) to separate table
- Compress historical data
- Maintain analytics summary tables
