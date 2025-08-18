// Security utilities and middleware exports

// Authentication utilities
export {
    createAuthContext, getCurrentUser, getUserPermissions,
    hasPermission, requireAuth,
    requirePermission, requireResourceAccess, requireRole, validateAuthRequirements, type AuthContext,
    type AuthOptions
} from './auth-utils';

// Server action security wrapper
export {
    createAdminAction, createAuthenticatedAction, createPermissionAction,
    createPublicAction, createSecureAction, type ActionContext, type SecureActionOptions
} from './server-action-wrapper';

// RBAC system
export {
    PERMISSION_GROUPS, Permission, ROLE_HIERARCHY, ROLE_PERMISSIONS, canAccessResource, getHighestRole, getRolePermissions, hasAllPermissions, hasAnyPermission, hasPermissionGroup, isRoleHigherOrEqual, hasPermission as rbacHasPermission, type ResourcePermission
} from './rbac';

// Route guards
export {
    RouteGuards,
    apiRouteGuard, canAccessAdmin,
    canAccessModerator, requireAuth as guardRequireAuth,
    requireRole as guardRequireRole, guardRoute, requireAdmin, requireCustomer, requireModerator, requirePermissions, withRouteGuard, type GuardResult, type RouteGuardOptions
} from './route-guards';

// Middleware
export {
    PROTECTED_ROUTES,
    PUBLIC_ROUTES, csrfMiddleware, config as middlewareConfig, rateLimitMiddleware, securityMiddleware
} from './middleware';

// API route security wrapper
export {
    createAdminAPIRoute, createAuthenticatedAPIRoute, createModeratorAPIRoute,
    createPermissionAPIRoute, createPublicAPIRoute, createSecureAPIRoute, type APIContext, type SecureAPIOptions
} from './api-wrapper';

// Validation schemas
export * from './action-schemas';

// CSRF protection
export const generateCSRFToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const validateCSRFToken = (token: string, expectedToken: string): boolean => {
  return token === expectedToken;
};