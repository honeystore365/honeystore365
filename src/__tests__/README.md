# Tests

Ce répertoire contient tous les tests pour l'application e-commerce Miel.

## Structure des Tests

```
__tests__/
├── components/       # Tests des composants React
├── examples/         # Exemples de tests pour référence
├── integration/      # Tests d'intégration (API, Server Actions)
├── mocks/            # Mocks pour Supabase, MSW, etc.
│   ├── handlers/     # Handlers MSW pour les API
│   ├── server.ts     # Configuration du serveur MSW
│   └── supabase.ts   # Mocks pour Supabase
├── unit/             # Tests unitaires (services, utilitaires)
└── utils/            # Utilitaires de test
    ├── test-env-setup.ts  # Configuration de l'environnement de test
    └── test-utils.ts      # Fonctions utilitaires pour les tests
```

## Types de Tests

### Tests Unitaires

Les tests unitaires testent des fonctions ou des classes individuelles de
manière isolée.

```typescript
import { setupUnitTest } from '../utils/test-env-setup';

// Configuration de l'environnement de test
setupUnitTest();

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
import { setupComponentTest } from '../utils/test-env-setup';
import { render, screen } from '../utils/test-utils';

// Configuration de l'environnement de test
setupComponentTest();

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
import { setupIntegrationTest } from '../utils/test-env-setup';

// Configuration de l'environnement de test
setupIntegrationTest();

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

## Commandes

- `npm run test` - Exécute tous les tests
- `npm run test:watch` - Exécute les tests en mode watch
- `npm run test:coverage` - Exécute les tests avec couverture
- `npm run test:unit` - Exécute uniquement les tests unitaires
- `npm run test:integration` - Exécute uniquement les tests d'intégration
- `npm run test:components` - Exécute uniquement les tests de composants
