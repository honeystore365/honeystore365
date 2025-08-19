# Guide de déploiement sur Vercel

Ce guide explique comment préparer et déployer votre application HoneyStore365 sur Vercel.

## Prérequis

1. Compte Vercel: [Créer un compte Vercel](https://vercel.com/signup)
2. Projet GitHub: Votre code doit être hébergé sur GitHub
3. Node.js 18+ (pour les tests locaux)
4. npm ou yarn

## Configuration du projet

### 1. Variables d'environnement

Créez un fichier `.env` à la racine de votre projet en vous basant sur `.env.example`:

```bash
cp .env.example .env
```

Éditez le fichier `.env` et ajoutez vos variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production

# Vercel Configuration
VERCEL=1

# Optional: Google Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Optional: Sentry (for error tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 2. Configuration Vercel

#### Méthode 1: Via l'interface web (recommandée)

1. Connectez-vous à votre compte Vercel
2. Cliquez sur "Add New..." → "Project"
3. Importez votre dépôt GitHub
4. Configurez les variables d'environnement dans l'onglet "Environment Variables"
5. Déployez

#### Méthode 2: Via Vercel CLI

1. Installez le CLI Vercel:
   ```bash
   npm install -g vercel
   ```

2. Connectez-vous:
   ```bash
   vercel login
   ```

3. Déployez:
   ```bash
   vercel
   ```

## Configuration du projet pour Vercel

### Fichiers de configuration

#### `vercel.json`
Ce fichier configure spécifiquement le déploiement sur Vercel:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["fra1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  }
}
```

#### `next.config.js`
La configuration Next.js est optimisée pour Vercel:

```javascript
const nextConfig = {
  // Configuration des images
  images: {
    domains: [
      'llsifflkfjogjagmbmpi.supabase.co',
      'images.unsplash.com',
      'via.placeholder.com',
      'res.cloudinary.com',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Configuration du build
  poweredByHeader: false,

  // Optimisation des bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};
```

### Scripts de déploiement

#### Script Bash (Linux/macOS)
```bash
./scripts/deploy-vercel.sh [environment]
```

#### Script PowerShell (Windows)
```powershell
.\scripts\deploy-vercel.ps1 [environment]
```

Les scripts disponibles:
- `./scripts/deploy-vercel.sh` ou `.\scripts\deploy-vercel.ps1` - Déploie en production
- `./scripts/deploy-vercel.sh staging` ou `.\scripts\deploy-vercel.ps1 -Environment staging` - Déploie en staging

## Déploiement automatisé avec GitHub

Pour un déploiement automatique à chaque push sur la branche principale:

1. Dans l'interface Vercel, configurez votre projet
2. Allez dans l'onglet "Settings" → "Git"
3. Activez "Auto Deployment" pour la branche principale
4. Configurez les webhooks si nécessaire

## Optimisation pour Vercel

### Images
- L'optimisation des images est configurée automatiquement
- Les formats WebP et AVIF sont utilisés
- Le domaine Supabase est ajouté aux domaines autorisés

### Sécurité
- Les headers de sécurité sont configurés
- La politique CSP est stricte
- La protection contre le clickjacking est activée

### Performance
- La compression est activée
- Le cache est optimisé
- Les régions sont configurées pour la France (fra1)

## Dépannage

### Problèmes courants

#### Erreurs de build
1. **Modules manquants**: Vérifiez que tous les fichiers sont bien commités
2. **Variables d'environnement**: Assurez-vous que toutes les variables sont définies dans Vercel
3. **Erreurs TypeScript**: Corrigez les erreurs de type avant de déployer

#### Problèmes d'exécution
1. **Erreurs Supabase**: Vérifiez que les URLs et clés sont correctes
2. **Images qui ne s'affichent pas**: Vérifiez la configuration des domaines dans `next.config.js`
3. **Authentification**: Vérifiez la configuration du middleware

### Commandes utiles

#### Tester localement
```bash
# Installer les dépendances
npm install

# Construire le projet
npm run build

# Démarrer le serveur de développement
npm run dev
```

#### Vercel CLI
```bash
# Lister les déploiements
vercel ls

# Afficher les logs
vercel logs

# Redéployer
vercel --prod
```

## Bonnes pratiques

### Environnement de production
1. **Testez toujours en staging** avant de déployer en production
2. **Surveillez les performances** avec Vercel Analytics
3. **Configurez les alertes** pour les erreurs critiques

### Sécurité
1. **Ne stockez jamais de clés secrètes** dans le code source
2. **Utilisez les variables d'environnement** de Vercel
3. **Activez les headers de sécurité**

### Performance
1. **Optimisez les images** avec les formats modernes
2. **Utilisez le caching** approprié
3. **Surveillez le Core Web Vitals**

## Support

Si vous rencontrez des problèmes:
1. Consultez la [documentation Vercel](https://vercel.com/docs)
2. Vérifiez les [issues GitHub](https://github.com/honeystore365/honeystore365/issues)
3. Contactez l'équipe de développement

## Mises à jour

Ce guide sera mis à jour régulièrement pour refléter les meilleures pratiques et les nouvelles fonctionnalités de Vercel.
