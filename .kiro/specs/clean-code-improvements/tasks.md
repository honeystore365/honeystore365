# Plan d'Implémentation - Amélioration Clean Code E-commerce Miel

- [x] 1. Configuration et Infrastructure de Base

  - Créer la structure de configuration centralisée avec validation des
    variables d'environnement
  - Implémenter le système de logging structuré avec différents niveaux
  - Configurer les outils de qualité de code (ESLint, Prettier, TypeScript
    strict)
  - _Exigences: 8.1, 8.2, 8.3, 8.4_

- [x] 1.1 Créer le système de configuration centralisé

  - Créer `src/lib/config/index.ts` avec validation des variables
    d'environnement
  - Implémenter les types TypeScript pour toutes les configurations
  - Ajouter la validation Zod pour les variables d'environnement au démarrage
  - _Exigences: 8.1, 8.2, 8.3_

- [x] 1.2 Implémenter le système de logging

  - Créer `src/lib/logger/index.ts` avec différents niveaux de log
  - Remplacer tous les `console.log` par le système de logging approprié
  - Configurer le logging pour différents environnements (dev/prod)
  - _Exigences: 1.1, 1.2, 1.3_

- [x] 1.3 Configurer les outils de qualité de code

  - Mettre à jour `.eslintrc.json` avec des règles strictes pour React/Next.js
  - Configurer Prettier avec des règles cohérentes
  - Activer le mode strict de TypeScript et corriger les erreurs
  - _Exigences: 6.3, 10.1_

- [x] 2. Système de Gestion d'Erreurs et Validation

  - Créer les classes d'erreurs personnalisées et le gestionnaire d'erreurs
    global
  - Implémenter le système de validation avec Zod pour tous les formulaires
  - Créer les composants d'affichage d'erreurs utilisateur
  - _Exigences: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.4_

- [x] 2.1 Créer le système de gestion d'erreurs

  - Créer `src/lib/errors/` avec les classes d'erreurs personnalisées
  - Implémenter `ErrorHandler` et `ErrorBoundary` React
  - Créer les composants d'affichage d'erreurs utilisateur localisées
  - _Exigences: 1.1, 1.3, 1.4_

- [x] 2.2 Implémenter le système de validation

  - Créer `src/lib/validation/` avec les schémas Zod pour tous les types
  - Implémenter les validators pour Product, User, Order, Address
  - Créer les hooks de validation pour les formulaires React
  - _Exigences: 3.1, 3.2, 3.4_

- [x] 2.3 Créer les composants de formulaires validés

  - Refactoriser `ProfileForm` avec validation Zod et gestion d'erreurs
  - Créer des composants de champs de formulaire réutilisables avec validation
  - Implémenter l'affichage d'erreurs de validation en temps réel
  - _Exigences: 3.1, 3.4, 7.4_

- [x] 3. Refactorisation des Types et Architecture

  - Centraliser tous les types TypeScript dans `src/types/`
  - Créer les interfaces métier avec les types Supabase
  - Refactoriser la structure des dossiers selon l'architecture proposée
  - _Exigences: 2.1, 2.2, 2.3, 2.4_

- [x] 3.1 Centraliser et améliorer les types

  - Réorganiser `src/types/` avec des sous-dossiers par domaine
  - Créer les types métier étendus (Product, User, Order, Cart)
  - Définir les enums et constantes typées (OrderStatus, UserRole, etc.)
  - _Exigences: 2.1, 2.2_

- [x] 3.2 Refactoriser la structure des dossiers

  - Créer la nouvelle structure `src/services/`, `src/lib/`, `src/components/`
  - Déplacer les fichiers existants selon la nouvelle architecture
  - Mettre à jour tous les imports après la réorganisation
  - _Exigences: 2.3, 2.4_

- [x] 3.3 Créer les interfaces de services

  - Définir les interfaces pour ProductService, CartService, OrderService
  - Créer les types de retour standardisés (ServiceResult<T>)
  - Implémenter les types pour les filtres et paramètres de recherche
  - _Exigences: 2.1, 2.2_

- [x] 4. Services Métier et Logique d'Application

  - Créer les services métier pour Products, Cart, Orders, Auth
  - Refactoriser les Server Actions pour utiliser les services
  - Implémenter la logique de cache et optimisation des requêtes
  - _Exigences: 2.1, 2.2, 4.1, 4.2, 4.3_

- [x] 4.1 Créer le ProductService

  - Implémenter `src/services/products/ProductService.ts`
  - Créer les méthodes getProducts, getProduct, searchProducts avec filtres
  - Ajouter la gestion du cache et l'optimisation des requêtes
  - _Exigences: 2.1, 4.2, 4.3_

- [x] 4.2 Créer le CartService

  - Refactoriser `src/actions/cartActions.ts` vers
    `src/services/cart/CartService.ts`
  - Implémenter la logique métier du panier avec validation
  - Ajouter la gestion des erreurs et la validation des quantités
  - _Exigences: 2.1, 3.1, 3.2_

- [x] 4.3 Créer l'OrderService

  - Implémenter `src/services/orders/OrderService.ts`
  - Créer la logique de création et gestion des commandes
  - Ajouter la validation des données de commande et gestion des statuts
  - _Exigences: 2.1, 3.1, 3.2_

- [x] 4.4 Créer l'AuthService

  - Refactoriser `src/actions/authActions.ts` vers
    `src/services/auth/AuthService.ts`
  - Implémenter la gestion sécurisée des sessions et rôles
  - Ajouter la validation des permissions et l'autorisation
  - _Exigences: 2.1, 3.2, 3.3_

- [x] 5. Système d'Internationalisation

  - Créer la structure de traduction et les fichiers de langues
  - Extraire toutes les chaînes hardcodées vers les fichiers de traduction
  - Implémenter les hooks et composants de traduction
  - _Exigences: 7.1, 7.2, 7.3, 7.4_

- [x] 5.1 Configurer le système i18n

  - Installer et configurer next-intl ou react-i18next
  - Créer `src/locales/` avec les fichiers de traduction ar/en
  - Configurer le middleware Next.js pour la détection de langue
  - _Exigences: 7.1, 7.3_

- [x] 5.2 Extraire les chaînes de traduction

  - Identifier toutes les chaînes hardcodées en arabe dans les composants
  - Créer les clés de traduction organisées par domaine
  - Remplacer les chaînes par les appels de traduction
  - _Exigences: 7.1, 7.4_

- [x] 5.3 Implémenter les utilitaires de formatage

  - Créer les fonctions de formatage des dates, nombres, devises
  - Implémenter le formatage RTL et les conventions locales arabes
  - Ajouter les hooks de traduction réutilisables
  - _Exigences: 7.2, 7.3_

- [x] 6. Refactorisation des Composants UI

  - Améliorer les composants existants avec l'accessibilité
  - Créer des composants réutilisables pour les formulaires et affichage
  - Optimiser les performances avec React.memo et useMemo
  - _Exigences: 4.3, 5.1, 5.2, 5.3, 5.4_

- [x] 6.1 Améliorer l'accessibilité des composants

  - Auditer et corriger `SiteHeader` avec les attributs ARIA appropriés
  - Ajouter le support de navigation clavier à tous les composants interactifs
  - Implémenter les annonces pour lecteurs d'écran dans les toasts
  - _Exigences: 5.1, 5.2, 5.3, 5.4_

- [x] 6.2 Optimiser les performances des composants

  - Refactoriser `ProductCardClient` avec React.memo et optimisations
  - Implémenter le lazy loading pour les images et composants lourds
  - Ajouter useMemo et useCallback où approprié
  - _Exigences: 4.1, 4.2, 4.3_

- [x] 6.3 Créer des composants de formulaire réutilisables

  - Créer `FormField`, `FormError`, `FormSection` avec validation intégrée
  - Refactoriser tous les formulaires pour utiliser les nouveaux composants
  - Implémenter la validation en temps réel et l'UX améliorée
  - _Exigences: 3.1, 3.4, 5.1_

- [x] 7. Sécurité et Authentification

  - Renforcer la sécurité des Server Actions et API Routes
  - Implémenter la validation d'autorisation pour toutes les opérations
  - Ajouter la protection CSRF et la validation des permissions
  - _Exigences: 3.2, 3.3_

- [x] 7.1 Sécuriser les Server Actions

  - Ajouter la validation d'authentification à toutes les actions serveur
  - Implémenter la vérification des permissions par rôle utilisateur
  - Ajouter la validation des données d'entrée avec Zod
  - _Exigences: 3.2, 3.3_

- [x] 7.2 Implémenter la gestion des rôles

  - Créer le système RBAC (Role-Based Access Control)
  - Ajouter les middleware de vérification des permissions
  - Implémenter les guards pour les routes protégées
  - _Exigences: 3.2, 3.3_

- [x] 7.3 Renforcer la sécurité des API

  - Ajouter la validation des tokens JWT dans les API routes
  - Implémenter le rate limiting pour prévenir les abus
  - Ajouter la sanitisation des données d'entrée
  - _Exigences: 3.2, 3.3_

- [x] 8. Tests et Qualité

  - Créer les tests unitaires pour les services et utilitaires
  - Implémenter les tests de composants avec React Testing Library
  - Ajouter les tests d'intégration pour les API et actions serveur
  - _Exigences: 6.1, 6.2, 6.3, 6.4_

- [x] 8.1 Configurer l'environnement de test

  - Installer et configurer Jest, React Testing Library, MSW
  - Créer les utilitaires de test et les mocks pour Supabase
  - Configurer les scripts de test dans package.json
  - _Exigences: 6.1, 6.4_

- [x] 8.2 Créer les tests unitaires des services

  - Compléter les tests pour ProductService avec différents scénarios et cas
    d'erreur
  - Tester CartService avec validation des quantités et erreurs
  - Tester les utilitaires de validation et formatage
  - Utiliser les mocks Supabase et les utilitaires de test existants
  - _Exigences: 6.1, 6.4_

- [x] 8.3 Créer les tests de composants

  - Tester les composants UI avec rendu et interactions utilisateur
  - Tester les formulaires avec validation et soumission
  - Tester l'accessibilité des composants avec jest-axe
  - Utiliser les utilitaires de test React Testing Library existants
  - _Exigences: 6.2, 5.1, 5.2, 5.3, 5.4_

- [x] 8.4 Créer les tests d'intégration

  - Tester les Server Actions avec mocks de base de données
  - Tester les API routes avec différents scénarios d'authentification
  - Tester les parcours utilisateur critiques (panier, commande)
  - _Exigences: 6.1, 6.4_

- [x] 9. Monitoring et Observabilité

  - Implémenter le système de métriques et monitoring
  - Configurer le tracking des erreurs avec Sentry
  - Ajouter les dashboards de monitoring des performances
  - _Exigences: 9.1, 9.2, 9.3, 9.4_

- [x] 9.1 Configurer le tracking des erreurs

  - Installer et configurer Sentry pour le monitoring d'erreurs
  - Intégrer Sentry avec le système de logging existant
  - Configurer les alertes pour les erreurs critiques
  - _Exigences: 9.1, 9.4_

- [x] 9.2 Implémenter les métriques business

  - Créer le tracking des conversions et abandons de panier
  - Implémenter les métriques de performance des pages critiques
  - Ajouter le monitoring des API et temps de réponse
  - _Exigences: 9.1, 9.2, 9.3_

- [x] 9.3 Créer les dashboards de monitoring

  - Configurer Vercel Analytics pour les métriques frontend
  - Créer un dashboard personnalisé pour les métriques business
  - Implémenter les alertes automatiques pour les seuils critiques
  - _Exigences: 9.1, 9.2, 9.3_

- [x] 10. Documentation et Finalisation

  - Créer la documentation technique et utilisateur
  - Documenter les APIs avec OpenAPI/Swagger
  - Finaliser les guides de contribution et déploiement
  - _Exigences: 10.1, 10.2, 10.3, 10.4_

- [x] 10.1 Créer la documentation technique

  - Documenter l'architecture et les patterns utilisés
  - Créer les guides de développement et bonnes pratiques
  - Documenter les services et leurs interfaces
  - Ajouter des exemples de code pour les patterns communs
  - _Exigences: 10.1, 10.2, 10.4_

- [x] 10.2 Documenter les APIs

  - Créer la documentation OpenAPI pour toutes les routes API
  - Documenter les Server Actions et leurs paramètres
  - Ajouter des exemples d'utilisation pour chaque endpoint
  - _Exigences: 10.2, 10.3_

- [x] 10.3 Finaliser les guides de déploiement

  - Créer le guide de déploiement pour différents environnements
  - Documenter les variables d'environnement requises
  - Créer les scripts de migration et de maintenance
  - _Exigences: 8.4, 10.4_

- [x] 10.4 Optimisation finale et audit

  - Effectuer un audit de performance avec Lighthouse
  - Vérifier la conformité d'accessibilité WCAG 2.1 AA
  - Optimiser les bundles JavaScript et les images
  - _Exigences: 4.1, 4.2, 4.4, 5.1, 5.2_

- [ ] 11. Finalisation et Nettoyage du Code

  - Remplacer les console.log restants par le système de logging
  - Extraire les chaînes hardcodées vers les fichiers de traduction
  - Nettoyer les TODOs et FIXMEs dans le code
  - _Exigences: 1.2, 7.1, 10.1_

- [x] 11.1 Remplacer les console.log restants

  - Remplacer les console.log dans src/lib/monitoring/alerts.ts par le système
    de logging
  - Remplacer les console.log dans src/lib/customCookieStorage.ts par le logger
  - Remplacer les console.log dans src/context/SessionProvider.tsx par le logger
  - Remplacer les console.log dans src/lib/performance.ts par le logger
  - Remplacer les console.log dans src/lib/monitoring/metrics.ts par le logger
  - Nettoyer les console.log de développement dans les autres fichiers
  - _Exigences: 1.2_

- [x] 11.2 Finaliser l'internationalisation

  - Extraire les messages d'erreur de validation hardcodés dans
    src/lib/validation/utils.ts
  - Extraire toutes les chaînes hardcodées dans src/components/ProfileForm.tsx
  - Créer les clés de traduction pour tous les messages d'erreur et labels
  - Remplacer toutes les chaînes hardcodées par des appels de traduction
  - Mettre à jour les fichiers ar.json et en.json avec les nouvelles clés
  - _Exigences: 7.1, 7.4_

- [x] 11.3 Résoudre les TODOs et améliorer les fonctionnalités

  - Implémenter la pagination dans ProductService
    (src/services/products/products.service.ts)
  - Implémenter la pagination dans OrderService
    (src/services/orders/orders.service.ts)
  - Implémenter la validation des codes de réduction dans OrderService
  - Implémenter le calcul des remises dans la fonction calculateOrderTotal
  - Ajouter l'authentification Google et Facebook dans la page de connexion
  - Initialiser correctement les services dans le registry
    (src/services/registry.ts)
  - _Exigences: 2.1, 3.1, 3.2_

- [x] 11.4 Audit final et optimisation
  - Effectuer un audit de sécurité complet avec les outils appropriés
  - Vérifier la performance avec Lighthouse (objectif: score > 90)
  - Valider l'accessibilité avec axe-core (conformité WCAG 2.1 AA)
  - Optimiser les bundles JavaScript et réduire la taille
  - Corriger tous les warnings TypeScript et ESLint restants
  - Vérifier que tous les tests passent et maintenir une couverture > 80%
  - _Exigences: 4.1, 4.4, 5.1, 5.2, 6.1, 6.3_
