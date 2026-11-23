export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  verified: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  inventory: number;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  vendorId: string;
  vendor?: {
    id: string;
    businessName: string;
    rating: number;
    verified: boolean;
  };
  categories?: {
    id: string;
    name: string;
    slug: string;
  }[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  vendorId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'PLACED' | 'PAID' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  itemCount: number;
  items?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    product?: {
      images: string[];
    };
  }[];
  trackingNumber?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  user?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  children?: Category[];
}
