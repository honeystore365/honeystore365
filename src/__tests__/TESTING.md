# Guide de Test pour E-commerce Miel

Ce document explique comment utiliser l'environnement de test configuré pour le
projet e-commerce Miel.

## Structure des Tests

```
__tests__/
├── components/       # Tests des composants React
├── integration/      # Tests d'intégration (API, Server Actions)
├── mocks/            # Mocks pour Supabase, MSW, etc.
│   ├── handlers/     # Handlers MSW pour les API
│   ├── server.ts     # Configuration du serveur MSW
│   └── supabase.ts   # Mocks pour Supabase
├── unit/             # Tests unitaires (services, utilitaires)
└── utils/            # Utilitaires de test
    └── test-utils.ts      # Fonctions utilitaires pour les tests
```

## Commandes de Test

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode watch
npm run test:watch

# Exécuter les tests avec couverture
npm run test:coverage

# Exécuter uniquement les tests unitaires
npm run test:unit

# Exécuter uniquement les tests d'intégration
npm run test:integration

# Exécuter uniquement les tests de composants
npm run test:components
```

## Types de Tests

### Tests Unitaires

Les tests unitaires testent des fonctions ou des classes individuelles de
manière isolée.

```typescript

describe('MonService', () => {
  it('devrait faire quelque chose', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Tests de Composants

Les tests de composants testent le rendu et le comportement des composants
React.

```typescript
import { render, screen } from '../utils/test-utils';

describe('MonComposant', () => {
  it('devrait rendre correctement', () => {
    // Arrange
    render(<MonComposant />);

    // Act & Assert
    expect(screen.getByText('Texte attendu')).toBeInTheDocument();
  });
});
```

### Tests d'Intégration

Les tests d'intégration testent l'interaction entre plusieurs parties du
système.

```typescript

describe('API', () => {
  it('devrait retourner des données', async () => {
    // Arrange
    // Act
    const response = await fetch('/api/endpoint');
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('propriété');
  });
});
```

## Utilitaires de Test

### Mocks Supabase

Pour tester les fonctionnalités qui utilisent Supabase, utilisez les mocks
fournis :

```typescript
import { mockSupabaseClient, mockSuccessResponse } from '../mocks/supabase';

// Configuration des mocks
mockSupabaseClient
  .from()
  .select()
  .then.mockResolvedValueOnce(mockSuccessResponse({ id: 1, name: 'Test' }));
```

### Mock Server (MSW)

Pour tester les appels API, utilisez MSW :

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

// Remplacer un handler pour un test spécifique
server.use(
  http.get('/api/endpoint', () => {
    return HttpResponse.json({ data: 'test' });
  })
);
```

### Données de Test

Utilisez les fonctions utilitaires pour créer des données de test :

```typescript
import { createMockProduct, createMockUser } from '../utils/test-utils';

const product = createMockProduct({ name: 'Miel Spécial' });
const user = createMockUser({ role: 'admin' });
```

## Bonnes Pratiques

1. **Nommage des Tests** : Utilisez des noms descriptifs pour vos tests qui
   expliquent clairement ce qui est testé.

2. **Pattern AAA** : Structurez vos tests selon le pattern Arrange-Act-Assert :
   - **Arrange** : Préparez les données et l'environnement
   - **Act** : Exécutez l'action à tester
   - **Assert** : Vérifiez les résultats

3. **Tests Isolés** : Chaque test doit être indépendant et ne pas dépendre
   d'autres tests.

4. **Mocks et Stubs** : Utilisez des mocks pour isoler le code testé des
   dépendances externes.

5. **Couverture de Code** : Visez une couverture de code d'au moins 70% pour les
   fonctionnalités critiques.

6. **Tests d'Accessibilité** : Incluez des tests d'accessibilité pour les
   composants UI avec jest-axe.

## Dépannage

### Problèmes Courants

1. **Tests qui échouent de manière intermittente** : Vérifiez les dépendances
   asynchrones et utilisez `waitFor` ou `findBy*` de React Testing Library.

2. **Erreurs de mémoire** : Nettoyez les ressources dans `afterEach` ou
   `afterAll`.

3. **Problèmes avec MSW** : Assurez-vous que les handlers sont correctement
   définis et que le serveur est démarré.

4. **Problèmes avec les mocks Supabase** : Réinitialisez les mocks après chaque
   test avec `resetSupabaseMocks()`.

### Déboguer les Tests

Pour déboguer les tests, utilisez :

```bash
# Exécuter un test spécifique en mode debug
npm test -- --debug-brk src/__tests__/path/to/test.ts
```

Ou ajoutez `console.log` dans vos tests pour voir les valeurs intermédiaires.
