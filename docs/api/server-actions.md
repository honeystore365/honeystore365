# Documentation des Server Actions

Ce document décrit les Server Actions disponibles dans l'application مناحل
الرحيق (Manahal Al-Rahiq). Les Server Actions sont des fonctions côté serveur
qui peuvent être appelées directement depuis les composants React.

## Table des matières

- [Actions du Panier](#actions-du-panier)
  - [addItemToCart](#additemtocart)
  - [getCartItems](#getcartitems)
  - [removeCartItem](#removecartitem)
  - [updateCartItemQuantity](#updatecartitemquantity)
  - [clearCart](#clearcart)
- [Actions d'Authentification](#actions-dauthentification)
  - [login](#login)
  - [register](#register)
  - [logout](#logout)
- [Actions de Profil](#actions-de-profil)
  - [updateProfile](#updateprofile)
  - [changePassword](#changepassword)
- [Actions de Catégorie](#actions-de-catégorie)
  - [getCategories](#getcategories)
- [Actions de Commande](#actions-de-commande)
  - [createOrder](#createorder)
  - [getOrders](#getorders)

## Actions du Panier

### addItemToCart

Ajoute un produit au panier de l'utilisateur ou met à jour la quantité si le
produit existe déjà.

**Paramètres:**

```typescript
{
  productId: string; // UUID du produit
  quantity: number; // Quantité à ajouter (minimum 1)
}
```

**Retourne:**

```typescript
{
  success: boolean;
  message: string;
}
```

**Erreurs possibles:**

| Code d'erreur         | Description                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| PRODUCT_NOT_FOUND     | Le produit demandé n'existe pas                                           |
| INVALID_PRODUCT_PRICE | Le prix du produit est invalide                                           |
| INSUFFICIENT_STOCK    | Stock insuffisant pour la quantité demandée                               |
| CART_ITEM_CHECK_ERROR | Erreur lors de la vérification de l'existence de l'article dans le panier |
| CART_UPDATE_ERROR     | Erreur lors de la mise à jour de la quantité                              |
| CART_INSERT_ERROR     | Erreur lors de l'ajout de l'article au panier                             |
| CART_ADD_ERROR        | Erreur générique lors de l'ajout au panier                                |

**Exemple d'utilisation:**

```typescript
'use client';
import { addItemToCart } from '@/actions/cartActions';

// Dans un composant React
const handleAddToCart = async () => {
  try {
    const result = await addItemToCart({
      productId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 1,
    });

    if (result.success) {
      // Afficher un message de succès
    }
  } catch (error) {
    // Gérer l'erreur
  }
};
```

### getCartItems

Récupère le contenu du panier de l'utilisateur connecté.

**Paramètres:** Aucun

**Retourne:**

```typescript
{
  items: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string | null;
      price: number | null;
      image_url: string | null;
      description: string | null;
    } | null;
  }>;
  total: number;
  error: string | null;
}
```

**Erreurs possibles:**

| Code d'erreur          | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| CART_FETCH_ERROR       | Erreur lors de la récupération du panier              |
| CART_CREATE_ERROR      | Erreur lors de la création d'un nouveau panier        |
| CART_ITEMS_FETCH_ERROR | Erreur lors de la récupération des articles du panier |
| CART_ITEMS_ERROR       | Erreur générique lors de la récupération des articles |

**Exemple d'utilisation:**

```typescript
'use client';
import { getCartItems } from '@/actions/cartActions';

// Dans un composant React
const fetchCartItems = async () => {
  try {
    const { items, total } = await getCartItems();
    // Utiliser les articles et le total
  } catch (error) {
    // Gérer l'erreur
  }
};
```

### removeCartItem

Supprime un article du panier de l'utilisateur.

**Paramètres:**

```typescript
{
  cartItemId: string; // UUID de l'article du panier
}
```

**Retourne:**

```typescript
{
  success: boolean;
  message: string;
}
```

**Erreurs possibles:**

| Code d'erreur            | Description                                |
| ------------------------ | ------------------------------------------ |
| CART_ITEM_NOT_FOUND      | L'article du panier n'existe pas           |
| UNAUTHORIZED_CART_ACCESS | Accès non autorisé à l'article du panier   |
| CART_ITEM_DELETE_ERROR   | Erreur lors de la suppression de l'article |
| CART_REMOVE_ERROR        | Erreur générique lors de la suppression    |

**Exemple d'utilisation:**

```typescript
'use client';
import { removeCartItem } from '@/actions/cartActions';

// Dans un composant React
const handleRemoveItem = async cartItemId => {
  try {
    const result = await removeCartItem({ cartItemId });
    if (result.success) {
      // Afficher un message de succès
    }
  } catch (error) {
    // Gérer l'erreur
  }
};
```

### updateCartItemQuantity

Met à jour la quantité d'un article dans le panier.

**Paramètres:**

```typescript
{
  cartItemId: string; // UUID de l'article du panier
  quantity: number; // Nouvelle quantité (minimum 1)
}
```

**Retourne:**

```typescript
{
  success: boolean;
  message: string;
}
```

**Erreurs possibles:**

| Code d'erreur            | Description                                  |
| ------------------------ | -------------------------------------------- |
| CART_ITEM_NOT_FOUND      | L'article du panier n'existe pas             |
| UNAUTHORIZED_CART_ACCESS | Accès non autorisé à l'article du panier     |
| INSUFFICIENT_STOCK       | Stock insuffisant pour la quantité demandée  |
| CART_ITEM_UPDATE_ERROR   | Erreur lors de la mise à jour de la quantité |
| CART_UPDATE_ERROR        | Erreur générique lors de la mise à jour      |

**Exemple d'utilisation:**

```typescript
'use client';
import { updateCartItemQuantity } from '@/actions/cartActions';

// Dans un composant React
const handleUpdateQuantity = async (cartItemId, newQuantity) => {
  try {
    const result = await updateCartItemQuantity({
      cartItemId,
      quantity: newQuantity,
    });
    if (result.success) {
      // Afficher un message de succès
    }
  } catch (error) {
    // Gérer l'erreur
  }
};
```

### clearCart

Vide complètement le panier de l'utilisateur.

**Paramètres:** Aucun

**Retourne:**

```typescript
{
  success: boolean;
  message: string;
}
```

**Erreurs possibles:**

| Code d'erreur     | Description                                          |
| ----------------- | ---------------------------------------------------- |
| CART_FETCH_ERROR  | Erreur lors de la récupération du panier             |
| CART_CREATE_ERROR | Erreur lors de la création d'un nouveau panier       |
| CART_CLEAR_ERROR  | Erreur lors de la suppression des articles du panier |

**Exemple d'utilisation:**

```typescript
'use client';
import { clearCart } from '@/actions/cartActions';

// Dans un composant React
const handleClearCart = async () => {
  try {
    const result = await clearCart();
    if (result.success) {
      // Afficher un message de succès
    }
  } catch (error) {
    // Gérer l'erreur
  }
};
```

## Actions d'Authentification

### login

Authentifie un utilisateur avec son email et son mot de passe.

**Paramètres:**

```typescript
{
  email: string;
  password: string;
  redirectTo?: string; // URL de redirection après connexion
}
```

**Retourne:**

```typescript
{
  success: boolean;
  message: string;
  redirectTo?: string;
}
```

**Erreurs possibles:**

| Code d'erreur       | Description                         |
| ------------------- | ----------------------------------- |
| INVALID_CREDENTIALS | Email ou mot de passe incorrect     |
| AUTH_ERROR          | Erreur générique d'authentification |

**Exemple d'utilisation:**

```typescript
'use client';
import { login } from '@/actions/authActions';

// Dans un formulaire de connexion
const handleSubmit = async formData => {
  try {
    const result = await login({
      email: formData.email,
      password: formData.password,
    });

    if (result.success && result.redirectTo) {
      window.location.href = result.redirectTo;
    }
  } catch (error) {
    // Afficher l'erreur
  }
};
```

### register

Inscrit un nouvel utilisateur.

**Paramètres:**

```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  redirectTo?: string; // URL de redirection après inscription
}
```

**Retourne:**

```typescript
{
  success: boolean;
  message: string;
  redirectTo?: string;
}
```

**Erreurs possibles:**

| Code d'erreur      | Description                                              |
| ------------------ | -------------------------------------------------------- |
| EMAIL_EXISTS       | L'email est déjà utilisé                                 |
| WEAK_PASSWORD      | Le mot de passe ne respecte pas les critères de sécurité |
| REGISTRATION_ERROR | Erreur générique d'inscription                           |

**Exemple d'utilisation:**

```typescript
'use client';
import { register } from '@/actions/authActions';

// Dans un formulaire d'inscription
const handleSubmit = async formData => {
  try {
    const result = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
    });

    if (result.success && result.redirectTo) {
      window.location.href = result.redirectTo;
    }
  } catch (error) {
    // Afficher l'erreur
  }
};
```

### logout

Déconnecte l'utilisateur actuel.

**Paramètres:** Aucun

**Retourne:**

```typescript
{
  success: boolean;
}
```

**Exemple d'utilisation:**

```typescript
'use client';
import { logout } from '@/actions/authActions';

// Dans un composant de déconnexion
const handleLogout = async () => {
  try {
    const result = await logout();
    if (result.success) {
      window.location.href = '/';
    }
  } catch (error) {
    // Gérer l'erreur
  }
};
```

## Actions de Profil

### updateProfile

Met à jour les informations du profil utilisateur.

**Paramètres:**

```typescript
{
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}
```

**Retourne:**

```typescript
{
  success: boolean;
  message: string;
}
```

**Erreurs possibles:**

| Code d'erreur        | Description                             |
| -------------------- | --------------------------------------- |
| VALIDATION_ERROR     | Données de profil invalides             |
| PROFILE_UPDATE_ERROR | Erreur lors de la mise à jour du profil |

**Exemple d'utilisation:**

```typescript
'use client';
import { updateProfile } from '@/actions/profileActions';

// Dans un formulaire de profil
const handleSubmit = async formData => {
  try {
    const result = await updateProfile({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      address: {
        street: formData.street,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
      },
    });

    if (result.success) {
      // Afficher un message de succès
    }
  } catch (error) {
    // Gérer l'erreur
  }
};
```

### changePassword

Change le mot de passe de l'utilisateur.

**Paramètres:**

```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

**Retourne:**

```typescript
{
  success: boolean;
  message: string;
}
```

**Erreurs possibles:**

| Code d'erreur            | Description                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| INVALID_CURRENT_PASSWORD | Le mot de passe actuel est incorrect                             |
| WEAK_PASSWORD            | Le nouveau mot de passe ne respecte pas les critères de sécurité |
| PASSWORD_CHANGE_ERROR    | Erreur lors du changement de mot de passe                        |

**Exemple d'utilisation:**

```typescript
'use client';
import { changePassword } from '@/actions/profileActions';

// Dans un formulaire de changement de mot de passe
const handleSubmit = async formData => {
  try {
    const result = await changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });

    if (result.success) {
      // Afficher un message de succès
    }
  } catch (error) {
    // Gérer l'erreur
  }
};
```

## Actions de Catégorie

### getCategories

Récupère la liste des catégories de produits.

**Paramètres:** Aucun

**Retourne:**

```typescript
{
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    parent_id?: string;
  }>;
}
```

**Exemple d'utilisation:**

```typescript
'use client';
import { getCategories } from '@/actions/categoryActions';

// Dans un composant React
const fetchCategories = async () => {
  try {
    const { categories } = await getCategories();
    // Utiliser les catégories
  } catch (error) {
    // Gérer l'erreur
  }
};
```

## Actions de Commande

### createOrder

Crée une nouvelle commande à partir du panier de l'utilisateur.

**Paramètres:**

```typescript
{
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'cash_on_delivery' | 'credit_card' | 'bank_transfer';
  notes?: string;
}
```

**Retourne:**

```typescript
{
  success: boolean;
  message: string;
  orderId?: string;
  redirectTo?: string;
}
```

**Erreurs possibles:**

| Code d'erreur      | Description                                     |
| ------------------ | ----------------------------------------------- |
| EMPTY_CART         | Le panier est vide                              |
| VALIDATION_ERROR   | Données de commande invalides                   |
| INSUFFICIENT_STOCK | Stock insuffisant pour un ou plusieurs articles |
| ORDER_CREATE_ERROR | Erreur lors de la création de la commande       |

**Exemple d'utilisation:**

```typescript
'use client';
import { createOrder } from '@/actions/checkoutActions';

// Dans un formulaire de commande
const handleSubmit = async formData => {
  try {
    const result = await createOrder({
      shippingAddress: {
        street: formData.street,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
      },
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
    });

    if (result.success && result.redirectTo) {
      window.location.href = result.redirectTo;
    }
  } catch (error) {
    // Gérer l'erreur
  }
};
```

### getOrders

Récupère la liste des commandes de l'utilisateur.

**Paramètres:**

```typescript
{
  limit?: number;
  offset?: number;
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}
```

**Retourne:**

```typescript
{
  orders: Array<{
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    items_count: number;
  }>;
  total: number;
}
```

**Erreurs possibles:**

| Code d'erreur      | Description                                  |
| ------------------ | -------------------------------------------- |
| ORDERS_FETCH_ERROR | Erreur lors de la récupération des commandes |

**Exemple d'utilisation:**

```typescript
'use client';
import { getOrders } from '@/actions/checkoutActions';

// Dans un composant React
const fetchOrders = async () => {
  try {
    const { orders, total } = await getOrders({
      limit: 10,
      offset: 0,
    });
    // Utiliser les commandes
  } catch (error) {
    // Gérer l'erreur
  }
};
```
