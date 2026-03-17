// HoneyStore365 Schema - E-commerce for Honey and Dates
// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    // System entities
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      name: i.string().optional(),
      phone: i.string().optional(),
      role: i.string().optional(), // 'admin' | 'customer'
      imageURL: i.string().optional(),
    }),
    
    // Business entities
    categories: i.entity({
      name: i.string().indexed(),
      description: i.string().optional(),
      sortOrder: i.number().indexed(),
    }),
    
    products: i.entity({
      name: i.string().indexed(),
      description: i.string().optional(),
      price: i.number().indexed(), // stored in millimes (1 DT = 1000)
      stock: i.number(),
      isAvailable: i.boolean().indexed(),
      weight: i.string().optional(), // e.g., "500g", "1kg"
      origin: i.string().optional(), // e.g., "Tunisia", "Saudi Arabia"
      createdAt: i.number(),
    }),
    
    productImages: i.entity({
      url: i.string(),
      alt: i.string().optional(),
      sortOrder: i.number(),
      createdAt: i.number(),
    }),
    
    orders: i.entity({
      // Invoice & Order tracking
      invoiceNumber: i.string().unique().indexed().optional(),
      
      // Order status workflow for cash on delivery
      // pending_confirmation → confirmed → processing → shipped → delivered
      // OR cancelled at any step
      status: i.string().indexed(), // pending_confirmation | confirmed | processing | shipped | delivered | cancelled
      
      // Payment
      paymentMethod: i.string().indexed(), // cash_on_delivery | bank_transfer | mobile_payment
      paymentStatus: i.string().indexed(), // pending | paid
      
      // Financial
      totalAmount: i.number(), // in millimes
      deliveryFee: i.number(), // in millimes
      
      // Customer info (snapshot at order time)
      customerName: i.string(),
      customerEmail: i.string().optional(),
      customerPhone: i.string().optional(),
      
      // Delivery address
      addressLine1: i.string(),
      city: i.string().indexed(),
      postalCode: i.string().optional(),
      
      // Admin notes
      adminNotes: i.string().optional(),
      
      // Timestamps
      orderedAt: i.number().indexed(),
      confirmedAt: i.number().optional(),
      shippedAt: i.number().optional(),
      deliveredAt: i.number().optional(),
    }),
    
    orderItems: i.entity({
      quantity: i.number(),
      unitPrice: i.number(), // snapshot price at order time (millimes)
      totalPrice: i.number(), // quantity * unitPrice (millimes)
    }),
    
    cartItems: i.entity({
      quantity: i.number(),
      addedAt: i.number(),
    }),
    
    reviews: i.entity({
      rating: i.number(),
      comment: i.string().optional(),
      createdAt: i.number(),
    }),
    
    // Store settings
    storeSettings: i.entity({
      storeName: i.string(),
      storeDescription: i.string().optional(),
      contactEmail: i.string().optional(),
      contactPhone: i.string().optional(),
      address: i.string().optional(),
      taxRate: i.number(), // percentage
      currency: i.string(),
      deliveryFee: i.number(), // in millimes
    }),
  },
  
  links: {
    // Product-Category (many-to-many)
    productCategory: {
      forward: { on: "products", has: "one", label: "category", onDelete: "cascade" },
      reverse: { on: "categories", has: "many", label: "products" },
    },
    
    // Product-Images (one-to-many)
    productImages: {
      forward: { on: "productImages", has: "one", label: "product", onDelete: "cascade" },
      reverse: { on: "products", has: "many", label: "images" },
    },
    
    // Order-Customer
    orderCustomer: {
      forward: { on: "orders", has: "one", label: "customer", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "orders" },
    },
    
    // Order-Items (one-to-many)
    orderItems: {
      forward: { on: "orderItems", has: "one", label: "order", onDelete: "cascade" },
      reverse: { on: "orders", has: "many", label: "items" },
    },
    
    // OrderItem-Product
    orderItemProduct: {
      forward: { on: "orderItems", has: "one", label: "product", onDelete: "cascade" },
      reverse: { on: "products", has: "many", label: "orderItems" },
    },
    
    // Cart-User
    cartUser: {
      forward: { on: "cartItems", has: "one", label: "customer", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "cartItems" },
    },
    
    // Cart-Product
    cartProduct: {
      forward: { on: "cartItems", has: "one", label: "product", onDelete: "cascade" },
      reverse: { on: "products", has: "many", label: "cartItems" },
    },
    
    // Review-Customer
    reviewCustomer: {
      forward: { on: "reviews", has: "one", label: "customer", onDelete: "cascade" },
      reverse: { on: "$users", has: "many", label: "reviews" },
    },
    
    // Review-Product
    reviewProduct: {
      forward: { on: "reviews", has: "one", label: "product", onDelete: "cascade" },
      reverse: { on: "products", has: "many", label: "reviews" },
    },
  },
  
  rooms: {},
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
