# Documentation API - مناحل الرحيق (Manahal Al-Rahiq)

Cette documentation décrit les API et Server Actions disponibles dans
l'application e-commerce مناحل الرحيق (Manahal Al-Rahiq).

## Structure de la Documentation

- [Spécification OpenAPI](./openapi.yaml) - Documentation complète des API REST
  au format OpenAPI 3.0
- [Documentation des Server Actions](./server-actions.md) - Documentation
  détaillée des Server Actions Next.js

## Vue d'ensemble des API

L'application expose deux types d'interfaces programmatiques :

1. **API REST** - Points d'accès HTTP traditionnels pour les opérations CRUD
2. **Server Actions** - Fonctions côté serveur appelables directement depuis les
   composants React

### API REST

Les API REST sont organisées selon les ressources suivantes :

- `/api/cart/*` - Gestion du panier d'achat
- `/api/admin/*` - Fonctionnalités d'administration

Toutes les API REST suivent ces conventions :

- Format de réponse : JSON
- Authentification : JWT via Bearer token
- Gestion d'erreurs : Codes HTTP standards avec corps d'erreur structuré

### Server Actions

Les Server Actions sont regroupées par domaine fonctionnel :

- `cartActions.ts` - Gestion du panier
- `authActions.ts` - Authentification et gestion des sessions
- `profileActions.ts` - Gestion du profil utilisateur
- `categoryActions.ts` - Gestion des catégories de produits
- `checkoutActions.ts` - Processus de commande

## Authentification et Sécurité

Toutes les API et Server Actions nécessitant une authentification utilisent JWT
(JSON Web Tokens) pour valider l'identité de l'utilisateur. Les tokens sont
générés lors de la connexion et doivent être inclus dans les requêtes API.

### Sécurité des API REST

Pour les API REST, le token JWT doit être inclus dans l'en-tête HTTP
`Authorization` sous la forme :

```
Authorization: Bearer <token>
```

### Sécurité des Server Actions

Les Server Actions authentifiées utilisent le wrapper
`createAuthenticatedAction` qui vérifie automatiquement la session utilisateur
côté serveur.

## Gestion des Erreurs

### Format d'Erreur API REST

```json
{
  "code": "ERROR_CODE",
  "message": "Description de l'erreur"
}
```

### Erreurs Server Actions

Les Server Actions lancent des exceptions de type `BusinessError` qui
contiennent :

```typescript
{
  name: "BusinessError",
  message: "Description de l'erreur",
  code: "ERROR_CODE"
}
```

## Exemples d'Utilisation

### Exemple d'Appel API REST

```javascript
// Ajouter un produit au panier
const response = await fetch('/api/cart/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    product_id: '123e4567-e89b-12d3-a456-426614174000',
    quantity: 1,
  }),
});

const data = await response.json();
```

### Exemple d'Utilisation de Server Action

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

## Outils de Développement

### Visualisation de la Documentation OpenAPI

Pour visualiser la documentation OpenAPI dans une interface interactive :

1. Installez Swagger UI ou Redoc
2. Pointez l'outil vers le fichier `openapi.yaml`

```bash
# Exemple avec npx et redoc-cli
npx redoc-cli serve ./docs/api/openapi.yaml
```

### Tests des API

Des exemples de requêtes pour tester les API sont disponibles dans la collection
Postman :

```
docs/api/postman/manahal-alrahiq-api.json
```

## Bonnes Pratiques

1. **Validation** - Toujours valider les entrées côté client avant d'appeler les
   API
2. **Gestion d'Erreurs** - Implémenter une gestion d'erreurs robuste pour tous
   les appels API
3. **Typage** - Utiliser TypeScript pour garantir la conformité des données
4. **Mise en Cache** - Mettre en cache les résultats des appels API lorsque
   approprié
5. **Revalidation** - Utiliser `revalidatePath` après les mutations pour
   maintenir la cohérence des données
