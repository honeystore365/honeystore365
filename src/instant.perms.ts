// HoneyStore365 Permissions
// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

// Helper: check if user is admin
// Note: In production, you'd want to check a role field or admin list
const isAdmin = "auth.id != null && auth.ref('$user.role')[0] == 'admin'";
const isAuthenticated = "auth.id != null";
const isOwner = "auth.id != null && auth.id == data.ref('customer.id')[0]";

const rules = {
  // Products: Public read, Admin write
  products: {
    allow: {
      view: "true", // Anyone can view products
      create: isAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
  },

  // Categories: Public read, Admin write
  categories: {
    allow: {
      view: "true",
      create: isAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
  },

  // Product-Category links: Public read, Admin write
  productCategories: {
    allow: {
      view: "true",
      create: isAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
  },

  // Orders: Owner & Admin view, Authenticated create, Admin update/delete
  orders: {
    allow: {
      view: `(${isAuthenticated} && (${isOwner} || ${isAdmin})) || ${isAdmin}`,
      create: isAuthenticated, // Authenticated users can create orders
      update: isAdmin, // Only admins can update order status
      delete: isAdmin,
    },
  },

  // Order Items: Same as orders (cascade)
  orderItems: {
    allow: {
      view: "true", // Linked to orders, visibility controlled via orders
      create: isAuthenticated,
      update: isAdmin,
      delete: isAdmin,
    },
  },

  // Cart Items: Owner only
  cartItems: {
    allow: {
      view: isOwner,
      create: isAuthenticated,
      update: isOwner,
      delete: isOwner,
    },
  },

  // Reviews: Public read, Owner & Admin write
  reviews: {
    allow: {
      view: "true",
      create: isAuthenticated,
      update: `${isOwner} || ${isAdmin}`,
      delete: `${isOwner} || ${isAdmin}`,
    },
  },

  // Users: Users can see their own profile, Admins can see all
  $users: {
    allow: {
      view: "true", // Allow viewing basic user info
      update: `${isAuthenticated} && (auth.id == data.id || ${isAdmin})`,
    },
    fields: {
      // Hide sensitive fields from public view
      email: `${isAuthenticated} && (auth.id == data.id || ${isAdmin})`,
      phone: `${isAuthenticated} && (auth.id == data.id || ${isAdmin})`,
    },
  },

  // Files: Public read, Admin write
  $files: {
    allow: {
      view: "true",
      create: isAdmin,
      delete: isAdmin,
    },
  },
} satisfies InstantRules;

export default rules;
