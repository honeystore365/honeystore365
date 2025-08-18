import { isAdminEmail } from './admin-auth';

// Types d'utilisateurs dans le système
export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  GUEST = 'guest'
}

// Interface pour le contexte utilisateur
export interface UserContext {
  role: UserRole;
  email?: string;
  isAdmin: boolean;
  isCustomer: boolean;
  isGuest: boolean;
  canUseCart: boolean;
  canAccessAdmin: boolean;
}

// Déterminer le rôle d'un utilisateur
export function getUserRole(user: any): UserRole {
  if (!user || !user.email) {
    return UserRole.GUEST;
  }
  
  if (isAdminEmail(user.email)) {
    return UserRole.ADMIN;
  }
  
  return UserRole.CUSTOMER;
}

// Créer le contexte utilisateur complet
export function createUserContext(user: any): UserContext {
  const role = getUserRole(user);
  
  return {
    role,
    email: user?.email,
    isAdmin: role === UserRole.ADMIN,
    isCustomer: role === UserRole.CUSTOMER,
    isGuest: role === UserRole.GUEST,
    canUseCart: role === UserRole.CUSTOMER || role === UserRole.GUEST,
    canAccessAdmin: role === UserRole.ADMIN
  };
}

// Vérifier si un utilisateur peut utiliser le panier
export function canUserUseCart(user: any): boolean {
  const role = getUserRole(user);
  return role === UserRole.CUSTOMER || role === UserRole.GUEST;
}

// Vérifier si un utilisateur peut accéder aux fonctions admin
export function canUserAccessAdmin(user: any): boolean {
  return getUserRole(user) === UserRole.ADMIN;
}

// Hook pour obtenir les capacités utilisateur
export function getUserCapabilities(user: any) {
  const context = createUserContext(user);
  
  return {
    // Fonctionnalités de panier
    showCartBadge: context.canUseCart,
    showAddToCartButtons: context.canUseCart,
    allowCartOperations: context.canUseCart,
    showCheckout: context.canUseCart,
    
    // Fonctionnalités admin
    showAdminMenu: context.canAccessAdmin,
    allowAdminOperations: context.canAccessAdmin,
    
    // Navigation
    showCustomerNavigation: context.isCustomer || context.isGuest,
    showAdminNavigation: context.isAdmin,
    
    // Profil
    showCustomerProfile: context.isCustomer,
    showAdminProfile: context.isAdmin,
  };
}