# Guide de Déploiement - مناحل الرحيق (Manahal Al-Rahiq)

Ce guide détaille les procédures de déploiement pour l'application e-commerce de
miel dans différents environnements.

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Environnements](#environnements)
4. [Variables d'environnement](#variables-denvironnement)
5. [Déploiement par environnement](#déploiement-par-environnement)
6. [Scripts de maintenance](#scripts-de-maintenance)
7. [Monitoring et observabilité](#monitoring-et-observabilité)
8. [Dépannage](#dépannage)

## Vue d'ensemble

L'application utilise une architecture moderne basée sur:

- **Frontend**: Next.js 15 avec App Router
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **Stockage**: Supabase Storage + UploadThing
- **Monitoring**: Sentry + Vercel Analytics
- **Déploiement**: Vercel (recommandé) ou Docker

## Prérequis

### Outils requis

- Node.js 18+
- npm ou pnpm
- Git
- Supabase CLI (pour les migrations)
- Vercel CLI (pour Vercel)

### Services externes

- Compte Supabase
- Compte Vercel (recommandé)
- Compte Sentry (monitoring)
- Compte UploadThing (upload de fichiers)

## Environnements

### 1. Développement (Local)

- URL: `http://localhost:3000`
- Base de données: Supabase local ou remote
- Variables: `.env.local`

### 2. Staging/Test

- URL: `https://staging-manahal-alrahiq.vercel.app`
- Base de données: Supabase staging
- Variables: Vercel environment variables

### 3. Production

- URL: `https://manahal-alrahiq.com`
- Base de données: Supabase production
- Variables: Vercel environment variables

## Variables d'environnement

Voir le fichier [environment-variables.md](./environment-variables.md) pour la
liste complète et détaillée.

### Variables critiques

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sécurité
JWT_SECRET=your_jwt_secret_32_chars_min
NEXTAUTH_SECRET=your_nextauth_secret

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

## Déploiement par environnement

### [Vercel (Recommandé)](./vercel-deployment.md)

Guide détaillé pour le déploiement sur Vercel

### [Docker](./docker-deployment.md)

Guide pour le déploiement avec Docker

### [Autres plateformes](./other-platforms.md)

Guides pour Netlify, Railway, etc.

## Scripts de maintenance

### Scripts disponibles

- `scripts/migrate.sh` - Migrations de base de données
- `scripts/backup.sh` - Sauvegarde de données
- `scripts/health-check.sh` - Vérification de santé
- `scripts/deploy.sh` - Déploiement automatisé
- `scripts/validate-env.sh` - Validation des variables d'environnement

### Utilisation

```bash
# Migration de base de données
./scripts/migrate.sh production

# Sauvegarde
./scripts/backup.sh production

# Vérification de santé
./scripts/health-check.sh https://votre-domaine.com

# Validation de l'environnement
./scripts/validate-env.sh production

# Déploiement automatisé
./scripts/deploy.sh production vercel
```

### Guide de maintenance

Consultez le [Guide de Maintenance](./maintenance.md) pour les procédures
détaillées de maintenance en production.

## Monitoring et observabilité

### Métriques surveillées

- Performance (Core Web Vitals)
- Erreurs (Sentry)
- Business metrics (conversions, panier)
- Infrastructure (Vercel Analytics)

### Dashboards

- Vercel Analytics: Performance et usage
- Sentry: Erreurs et performance
- Supabase: Base de données et auth
- Custom Dashboard: `/monitoring`

## Dépannage

### Problèmes courants

1. **Erreurs de build**: Vérifier les types TypeScript
2. **Variables manquantes**: Vérifier la configuration
3. **Erreurs de base de données**: Vérifier les migrations
4. **Problèmes d'auth**: Vérifier les URLs de redirection

### Logs et debugging

```bash
# Logs Vercel
vercel logs

# Logs Supabase
supabase logs

# Logs locaux
npm run dev
```

## Support et contacts

- **Documentation technique**: [docs/](../README.md)
- **Issues**: GitHub Issues
- **Monitoring**: [Dashboard de monitoring](/monitoring)

---

**Note**: Ce guide est maintenu à jour avec chaque release. Vérifiez la version
avant déploiement.
