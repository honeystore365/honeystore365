import { logger } from '@/lib/logger';

// Configuration du compte administrateur
export const ADMIN_CONFIG = {
  email: 'honeystore365@gmail.com',
  role: 'super_admin',
  permissions: [
    'manage_products',
    'manage_orders',
    'manage_customers',
    'manage_settings',
    'view_analytics',
    'manage_discounts',
    'system_admin'
  ]
} as const;

// Vérifier si un email est celui de l'administrateur
export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === ADMIN_CONFIG.email.toLowerCase();
}

// Vérifier si un utilisateur est administrateur
export function isAdminUser(user: any): boolean {
  if (!user || !user.email) {
    return false;
  }
  
  return isAdminEmail(user.email);
}

// Vérifier les permissions d'administrateur
export function hasAdminPermission(user: any, permission: string): boolean {
  if (!isAdminUser(user)) {
    return false;
  }
  
  return ADMIN_CONFIG.permissions.includes(permission as any);
}

// Middleware de vérification admin pour les Server Actions
export function requireAdmin(user: any): void {
  if (!isAdminUser(user)) {
    logger.warn('Unauthorized admin access attempt', {
      component: 'AdminAuth',
      userEmail: user?.email || 'unknown',
      action: 'requireAdmin'
    });
    throw new Error('Access denied: Admin privileges required');
  }
}

// Middleware de vérification admin avec permission spécifique
export function requireAdminPermission(user: any, permission: string): void {
  requireAdmin(user);
  
  if (!hasAdminPermission(user, permission)) {
    logger.warn('Insufficient admin permissions', {
      component: 'AdminAuth',
      userEmail: user.email,
      requiredPermission: permission,
      action: 'requireAdminPermission'
    });
    throw new Error(`Access denied: ${permission} permission required`);
  }
}

// Créer un contexte admin sécurisé
export function createAdminContext(user: any) {
  if (!isAdminUser(user)) {
    return null;
  }
  
  return {
    user,
    email: user.email,
    role: ADMIN_CONFIG.role,
    permissions: ADMIN_CONFIG.permissions,
    isAdmin: true,
    isSuperAdmin: true
  };
}

// Valider une session admin
export function validateAdminSession(session: any): boolean {
  if (!session || !session.user) {
    return false;
  }
  
  return isAdminUser(session.user);
}

// Logger pour les actions admin
export function logAdminAction(action: string, user: any, metadata?: any) {
  logger.info(`Admin action: ${action}`, {
    component: 'AdminAuth',
    adminEmail: user?.email,
    action,
    ...metadata
  });
}

