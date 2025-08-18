# Déploiement sur Autres Plateformes - مناحل الرحيق

Guide pour déployer l'application sur différentes plateformes cloud alternatives
à Vercel.

## Table des Matières

1. [Netlify](#netlify)
2. [Railway](#railway)
3. [Render](#render)
4. [DigitalOcean App Platform](#digitalocean-app-platform)
5. [AWS Amplify](#aws-amplify)
6. [Heroku](#heroku)
7. [Comparaison des Plateformes](#comparaison-des-plateformes)

## Netlify

### Configuration

Créez `netlify.toml` à la racine:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  NODE_ENV = "production"

[context.deploy-preview.environment]
  NODE_ENV = "staging"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Variables d'Environnement

Dans le dashboard Netlify:

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://votre-site.netlify.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
```

### Déploiement

```bash
# Installation Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Déploiement
netlify deploy --prod --dir=.next
```

### Limitations

- Pas de support natif pour les API routes Next.js
- Nécessite des fonctions Netlify pour les API
- Pas de support pour les middlewares Next.js

## Railway

### Configuration

Créez `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Variables d'Environnement

```bash
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SITE_URL=https://votre-app.railway.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
```

### Déploiement

```bash
# Installation Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialisation
railway init

# Déploiement
railway up
```

### Avantages

- Support complet Next.js
- Base de données PostgreSQL intégrée
- Scaling automatique
- Prix compétitif

## Render

### Configuration

Créez `render.yaml`:

```yaml
services:
  - type: web
    name: manahal-alrahiq
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_SITE_URL
        value: https://manahal-alrahiq.onrender.com
      - key: NEXT_PUBLIC_SUPABASE_URL
        fromService:
          type: pserv
          name: supabase-url
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
```

### Variables d'Environnement

Dans le dashboard Render:

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://votre-app.onrender.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
```

### Déploiement

1. Connectez votre repository GitHub
2. Configurez les variables d'environnement
3. Déployez automatiquement

### Avantages

- Support complet Next.js
- SSL automatique
- Déploiements automatiques
- Plan gratuit disponible

## DigitalOcean App Platform

### Configuration

Créez `.do/app.yaml`:

```yaml
name: manahal-alrahiq
services:
  - name: web
    source_dir: /
    github:
      repo: votre-username/votre-repo
      branch: main
    run_command: npm start
    build_command: npm ci && npm run build
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3000
    health_check:
      http_path: /api/health
    envs:
      - key: NODE_ENV
        value: 'production'
      - key: NEXT_PUBLIC_SITE_URL
        value: 'https://manahal-alrahiq-xxxxx.ondigitalocean.app'
```

### Variables d'Environnement

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://votre-app.ondigitalocean.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
```

### Déploiement

```bash
# Installation doctl
# Voir: https://docs.digitalocean.com/reference/doctl/how-to/install/

# Login
doctl auth init

# Déploiement
doctl apps create --spec .do/app.yaml
```

## AWS Amplify

### Configuration

Créez `amplify.yml`:

```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
    appRoot: /
```

### Variables d'Environnement

Dans la console AWS Amplify:

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://votre-app.amplifyapp.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
```

### Limitations

- Support limité pour les API routes
- Nécessite des fonctions Lambda pour les API
- Configuration plus complexe

## Heroku

### Configuration

Créez `Procfile`:

```
web: npm start
```

Créez `app.json`:

```json
{
  "name": "manahal-alrahiq",
  "description": "E-commerce application for honey products",
  "repository": "https://github.com/votre-username/votre-repo",
  "keywords": ["nextjs", "ecommerce", "honey"],
  "env": {
    "NODE_ENV": {
      "value": "production"
    },
    "NEXT_PUBLIC_SITE_URL": {
      "description": "The URL of your application"
    },
    "NEXT_PUBLIC_SUPABASE_URL": {
      "description": "Supabase project URL"
    },
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": {
      "description": "Supabase anonymous key"
    },
    "SUPABASE_SERVICE_ROLE_KEY": {
      "description": "Supabase service role key"
    },
    "JWT_SECRET": {
      "description": "JWT secret for authentication"
    },
    "NEXTAUTH_SECRET": {
      "description": "NextAuth secret"
    }
  },
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ]
}
```

### Déploiement

```bash
# Installation Heroku CLI
# Voir: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Création de l'app
heroku create manahal-alrahiq

# Configuration des variables
heroku config:set NODE_ENV=production
heroku config:set NEXT_PUBLIC_SITE_URL=https://manahal-alrahiq.herokuapp.com

# Déploiement
git push heroku main
```

### Note

Heroku a supprimé son plan gratuit. Considérez les alternatives.

## Comparaison des Plateformes

| Plateforme       | Support Next.js | Prix | Facilité   | Performance | Recommandation |
| ---------------- | --------------- | ---- | ---------- | ----------- | -------------- |
| **Vercel**       | ⭐⭐⭐⭐⭐      | €€   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐  | **Recommandé** |
| **Railway**      | ⭐⭐⭐⭐⭐      | €    | ⭐⭐⭐⭐   | ⭐⭐⭐⭐    | Très bon       |
| **Render**       | ⭐⭐⭐⭐        | €    | ⭐⭐⭐⭐   | ⭐⭐⭐      | Bon            |
| **DigitalOcean** | ⭐⭐⭐⭐        | €€   | ⭐⭐⭐     | ⭐⭐⭐⭐    | Bon            |
| **Netlify**      | ⭐⭐            | €    | ⭐⭐⭐⭐   | ⭐⭐⭐      | Limité         |
| **AWS Amplify**  | ⭐⭐            | €€€  | ⭐⭐       | ⭐⭐⭐⭐    | Complexe       |

### Critères de Choix

#### Choisir Vercel si:

- Vous voulez la meilleure expérience Next.js
- Performance maximale requise
- Budget disponible pour les fonctionnalités premium

#### Choisir Railway si:

- Vous voulez une alternative économique à Vercel
- Vous avez besoin d'une base de données intégrée
- Simplicité de configuration importante

#### Choisir Render si:

- Budget limité
- Besoin d'un plan gratuit pour débuter
- Application simple sans besoins complexes

#### Choisir DigitalOcean si:

- Vous utilisez déjà l'écosystème DigitalOcean
- Contrôle et flexibilité importants
- Intégration avec d'autres services DO

## Scripts de Déploiement Multi-Plateformes

Créez `scripts/deploy-platform.sh`:

```bash
#!/bin/bash

PLATFORM=${1:-vercel}
ENVIRONMENT=${2:-staging}

case $PLATFORM in
    vercel)
        ./scripts/deploy.sh $ENVIRONMENT vercel
        ;;
    railway)
        railway up --environment $ENVIRONMENT
        ;;
    render)
        # Render déploie automatiquement via Git
        git push origin main
        ;;
    netlify)
        netlify deploy --prod --dir=.next
        ;;
    *)
        echo "Plateforme non supportée: $PLATFORM"
        echo "Plateformes disponibles: vercel, railway, render, netlify"
        exit 1
        ;;
esac
```

## Monitoring Multi-Plateformes

Chaque plateforme offre ses propres outils de monitoring:

- **Vercel**: Analytics intégré + Vercel Speed Insights
- **Railway**: Métriques intégrées + logs
- **Render**: Dashboard de monitoring
- **DigitalOcean**: Monitoring App Platform

Pour un monitoring unifié, utilisez:

- **Sentry** pour les erreurs
- **Vercel Analytics** (fonctionne sur toutes les plateformes)
- **Custom dashboard** (`/monitoring`)

## Recommandations

1. **Pour la production**: Vercel (optimal) ou Railway (économique)
2. **Pour le staging**: Railway ou Render
3. **Pour les tests**: Netlify ou plan gratuit Render
4. **Pour l'entreprise**: DigitalOcean ou AWS

---

**Note**: Les prix et fonctionnalités évoluent. Vérifiez les sites officiels
pour les informations les plus récentes.
