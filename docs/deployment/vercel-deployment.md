# Déploiement sur Vercel - مناحل الرحيق

Guide détaillé pour déployer l'application sur Vercel (plateforme recommandée).

## Prérequis

- Compte Vercel
- Projet Supabase configuré
- Repository Git (GitHub, GitLab, ou Bitbucket)
- Vercel CLI installé (optionnel)

```bash
npm install -g vercel
```

## Configuration Initiale

### 1. Connexion du Repository

1. Connectez-vous à [vercel.com](https://vercel.com)
2. Cliquez sur "New Project"
3. Importez votre repository Git
4. Sélectionnez le framework "Next.js"

### 2. Configuration du Build

Vercel détecte automatiquement Next.js, mais vous pouvez personnaliser:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

### 3. Variables d'Environnement

Dans le dashboard Vercel, allez dans Settings > Environment Variables:

#### Variables de Production

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=مناحل الرحيق
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=votre_secret_jwt_32_chars_minimum
NEXTAUTH_SECRET=votre_secret_nextauth_32_chars_minimum
UPLOADTHING_TOKEN=sk_live_...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=votre-org-sentry
SENTRY_PROJECT=manahal-alrahiq
SENTRY_AUTH_TOKEN=sntrys_...
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHATBOT=true
NEXT_PUBLIC_ENABLE_A11Y=true
```

#### Variables de Preview/Staging

Même configuration mais avec des valeurs de staging.

## Déploiement

### Déploiement Automatique

Vercel déploie automatiquement:

- **Production**: À chaque push sur la branche `main`
- **Preview**: À chaque push sur les autres branches
- **Pull Requests**: Déploiements de preview automatiques

### Déploiement Manuel

```bash
# Déploiement de production
vercel --prod

# Déploiement de preview
vercel

# Avec des variables d'environnement spécifiques
vercel --env NODE_ENV=production
```

## Configuration Avancée

### 1. Domaine Personnalisé

1. Dans Settings > Domains
2. Ajoutez votre domaine
3. Configurez les DNS selon les instructions Vercel

### 2. Redirections et Rewrites

Créez `vercel.json` à la racine:

```json
{
  "redirects": [
    {
      "source": "/admin",
      "destination": "/dashboard",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health-check"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 3. Configuration des Fonctions

Pour les API routes avec des besoins spécifiques:

```json
{
  "functions": {
    "src/app/api/heavy-task/route.ts": {
      "maxDuration": 30
    }
  }
}
```

## Optimisations

### 1. Performance

```javascript
// next.config.ts
const nextConfig = {
  // Optimisation des images
  images: {
    domains: ['votre-domaine.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Compression
  compress: true,

  // Headers de cache
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### 2. Bundle Analysis

```bash
# Analyser le bundle
ANALYZE=true npm run build

# Ou avec Vercel CLI
vercel build --debug
```

## Monitoring et Observabilité

### 1. Vercel Analytics

Automatiquement activé avec `@vercel/analytics`:

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 2. Speed Insights

```typescript
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 3. Logs et Debugging

```bash
# Voir les logs en temps réel
vercel logs

# Logs d'une fonction spécifique
vercel logs --follow

# Logs avec filtres
vercel logs --since=1h --until=30m
```

## Environnements Multiples

### Configuration par Branche

1. **Production** (`main`): Variables de production
2. **Staging** (`develop`): Variables de staging
3. **Feature branches**: Variables de développement

### Script de Déploiement

```bash
#!/bin/bash
# scripts/deploy-vercel.sh

ENVIRONMENT=${1:-preview}

if [ "$ENVIRONMENT" = "production" ]; then
    echo "Déploiement en production..."
    vercel --prod --confirm
elif [ "$ENVIRONMENT" = "staging" ]; then
    echo "Déploiement en staging..."
    vercel --target staging
else
    echo "Déploiement de preview..."
    vercel
fi

echo "Déploiement terminé!"
```

## Sécurité

### 1. Variables Sensibles

- Utilisez les Environment Variables de Vercel
- Ne jamais exposer les secrets côté client
- Différenciez les clés par environnement

### 2. Headers de Sécurité

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ]
}
```

## Dépannage

### Erreurs Communes

1. **Build Failed**

   ```bash
   # Vérifier les erreurs TypeScript
   npm run typecheck

   # Vérifier le linting
   npm run lint
   ```

2. **Variables d'Environnement**

   ```bash
   # Vérifier les variables dans Vercel
   vercel env ls

   # Ajouter une variable
   vercel env add VARIABLE_NAME
   ```

3. **Problèmes de Domaine**
   - Vérifier la configuration DNS
   - Attendre la propagation (jusqu'à 48h)
   - Vérifier les certificats SSL

### Rollback

```bash
# Lister les déploiements
vercel ls

# Promouvoir un déploiement précédent
vercel promote <deployment-url>
```

## Maintenance

### 1. Mises à Jour

```bash
# Mettre à jour Vercel CLI
npm update -g vercel

# Mettre à jour les dépendances
npm update
```

### 2. Monitoring

- Dashboard Vercel: Métriques et performances
- Sentry: Erreurs et monitoring
- Supabase: Base de données et auth

### 3. Sauvegardes

Les déploiements Vercel sont automatiquement sauvegardés. Pour les données:

```bash
# Sauvegarde Supabase
supabase db dump --file backup.sql

# Restauration
supabase db reset --file backup.sql
```

## Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Next.js sur Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Variables d'environnement](https://vercel.com/docs/concepts/projects/environment-variables)
- [Domaines personnalisés](https://vercel.com/docs/concepts/projects/custom-domains)

---

**Note**: Ce guide est spécifique à Vercel. Pour d'autres plateformes, consultez
les guides correspondants.
