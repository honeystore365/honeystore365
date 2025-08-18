import { UserRole } from '@/types/enums';

/**
 * Role-Based Access Control (RBAC) System
 * Defines permissions and role hierarchies
 */

// Define all available permissions in the system
export enum Permission {
  // Product permissions
  PRODUCTS_READ = 'products:read',
  PRODUCTS_WRITE = 'products:write',
  PRODUCTS_DELETE = 'products:delete',
  
  // Category permissions
  CATEGORIES_READ = 'categories:read',
  CATEGORIES_WRITE = 'categories:write',
  CATEGORIES_DELETE = 'categories:delete',
  
  // Order permissions
  ORDERS_READ = 'orders:read',
  ORDERS_WRITE = 'orders:write',
  ORDERS_CREATE = 'orders:create',
  ORDERS_UPDATE = 'orders:update',
  ORDERS_DELETE = 'orders:delete',
  ORDERS_MANAGE_ALL = 'orders:manage_all', // Admin can manage all orders
  
  // Cart permissions
  CART_READ = 'cart:read',
  CART_WRITE = 'cart:write',
  
  // User/Profile permissions
  PROFILE_READ = 'profile:read',
  PROFILE_WRITE = 'profile:write',
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',
  USERS_MANAGE_ALL = 'users:manage_all', // Admin can manage all users
  
  // Admin permissions
  ADMIN_DASHBOARD = 'admin:dashboard',
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_REPORTS = 'admin:reports',
  
  // System permissions
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_MONITORING = 'system:monitoring',
  
  // Special permissions
  ALL = '*', // Super admin permission
}

// Define role hierarchies and their permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.ALL, // Admin has all permissions
  ],
  
  [UserRole.MODERATOR]: [
    // Product management
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_WRITE,
    Permission.CATEGORIES_READ,
    Permission.CATEGORIES_WRITE,
    
    // Order management
    Permission.ORDERS_READ,
    Permission.ORDERS_UPDATE,
    Permission.ORDERS_MANAGE_ALL,
    
    // User management (limited)
    Permission.USERS_READ,
    
    // Reports
    Permission.ADMIN_REPORTS,
  ],
  
  [UserRole.CUSTOMER]: [
    // Own cart management
    Permission.CART_READ,
    Permission.CART_WRITE,
    
    // Own orders
    Permission.ORDERS_READ,
    Permission.ORDERS_CREATE,
    
    // Own profile
    Permission.PROFILE_READ,
    Permission.PROFILE_WRITE,
    
    // Product browsing
    Permission.PRODUCTS_READ,
    Permission.CATEGORIES_READ,
  ],
};

// Define resource-based permissions (for accessing specific resources)
export interface ResourcePermission {
  resource: string;
  action: string;
  conditions?: {
    ownerId?: string;
    status?: string[];
    [key: string]: any;
  };
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  
  // Check for super admin permission
  if (rolePermissions.includes(Permission.ALL)) {
    return true;
  }
  
  // Check for specific permission
  return rolePermissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user can access a specific resource
 */
export function canAccessResource(
  userRole: UserRole,
  userId: string,
  resourcePermission: ResourcePermission,
  resourceOwnerId?: string
): boolean {
  const { resource, action, conditions } = resourcePermission;
  const permission = `${resource}:${action}` as Permission;
  
  // Check basic permission
  if (!hasPermission(userRole, permission)) {
    // Check if user can access their own resource
    if (conditions?.ownerId && userId === resourceOwnerId) {
      const ownResourcePermission = `${resource}:${action}` as Permission;
      return hasPermission(userRole, ownResourcePermission);
    }
    return false;
  }
  
  // Check additional conditions
  if (conditions) {
    // Owner-based access
    if (conditions.ownerId && userId !== resourceOwnerId) {
      // Check if user has permission to manage all resources of this type
      const manageAllPermission = `${resource}:manage_all` as Permission;
      return hasPermission(userRole, manageAllPermission);
    }
    
    // Status-based access
    if (conditions.status && Array.isArray(conditions.status)) {
      // Additional status checks can be implemented here
      // For now, we assume status conditions are met if basic permission exists
    }
  }
  
  return true;
}

/**
 * Role hierarchy - higher roles inherit permissions from lower roles
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.ADMIN]: [UserRole.MODERATOR, UserRole.CUSTOMER],
  [UserRole.MODERATOR]: [UserRole.CUSTOMER],
  [UserRole.CUSTOMER]: [],
};

/**
 * Check if a role is higher than or equal to another role
 */
export function isRoleHigherOrEqual(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === requiredRole) {
    return true;
  }
  
  const hierarchy = ROLE_HIERARCHY[userRole] || [];
  return hierarchy.includes(requiredRole);
}

/**
 * Get the highest role from a list of roles
 */
export function getHighestRole(roles: UserRole[]): UserRole {
  if (roles.includes(UserRole.ADMIN)) return UserRole.ADMIN;
  if (roles.includes(UserRole.MODERATOR)) return UserRole.MODERATOR;
  return UserRole.CUSTOMER;
}

/**
 * Permission groups for easier management
 */
export const PERMISSION_GROUPS = {
  PRODUCT_MANAGEMENT: [
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_WRITE,
    Permission.PRODUCTS_DELETE,
    Permission.CATEGORIES_READ,
    Permission.CATEGORIES_WRITE,
    Permission.CATEGORIES_DELETE,
  ],
  
  ORDER_MANAGEMENT: [
    Permission.ORDERS_READ,
    Permission.ORDERS_WRITE,
    Permission.ORDERS_CREATE,
    Permission.ORDERS_UPDATE,
    Permission.ORDERS_DELETE,
    Permission.ORDERS_MANAGE_ALL,
  ],
  
  USER_MANAGEMENT: [
    Permission.USERS_READ,
    Permission.USERS_WRITE,
    Permission.USERS_DELETE,
    Permission.USERS_MANAGE_ALL,
  ],
  
  ADMIN_FEATURES: [
    Permission.ADMIN_DASHBOARD,
    Permission.ADMIN_SETTINGS,
    Permission.ADMIN_REPORTS,
    Permission.SYSTEM_LOGS,
    Permission.SYSTEM_MONITORING,
  ],
  
  CUSTOMER_FEATURES: [
    Permission.CART_READ,
    Permission.CART_WRITE,
    Permission.PROFILE_READ,
    Permission.PROFILE_WRITE,
    Permission.ORDERS_READ,
    Permission.ORDERS_CREATE,
  ],
};

/**
 * Check if role has permission group
 */
export function hasPermissionGroup(role: UserRole, groupName: keyof typeof PERMISSION_GROUPS): boolean {
  const permissions = PERMISSION_GROUPS[groupName];
  return hasAllPermissions(role, permissions);
}