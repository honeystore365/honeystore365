# Variables d'Environnement - مناحل الرحيق

Ce document détaille toutes les variables d'environnement requises pour
l'application.

## Variables Obligatoires

### Configuration de l'Application

```bash
# Environnement de l'application
NODE_ENV=production|development|test
# Nom de l'application (affiché dans l'interface)
NEXT_PUBLIC_APP_NAME="مناحل الرحيق"
# Version de l'application
NEXT_PUBLIC_APP_VERSION="1.0.0"
# URL publique du site (utilisée pour les redirections et emails)
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
```

### Configuration Supabase

```bash
# URL de votre projet Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
# Clé publique anonyme Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Clé de service (côté serveur uniquement)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Sécurité et Authentification

```bash
# Secret JWT (minimum 32 caractères)
JWT_SECRET=votre_secret_jwt_tres_long_et_securise_32_chars_minimum
# Secret NextAuth (généré automatiquement si non défini)
NEXTAUTH_SECRET=votre_secret_nextauth_32_chars_minimum
```

## Variables Optionnelles

### Services Externes

```bash
# Token UploadThing pour l'upload de fichiers
UPLOADTHING_TOKEN=sk_live_...
# Clé API Google (pour services AI optionnels)
GOOGLE_API_KEY=AIzaSy...
```

### Feature Flags

```bash
# Activer/désactiver le chatbot IA
NEXT_PUBLIC_ENABLE_CHATBOT=true|false
# Activer/désactiver les analytics
NEXT_PUBLIC_ENABLE_ANALYTICS=true|false
# Activer/désactiver les fonctionnalités d'accessibilité
NEXT_PUBLIC_ENABLE_A11Y=true|false
```

### Configuration de Logging

```bash
# Niveau de log (error, warn, info, debug)
LOG_LEVEL=info|warn|error|debug
# Activer le logging des requêtes HTTP
ENABLE_REQUEST_LOGGING=true|false
```

### Monitoring et Observabilité

```bash
# DSN Sentry pour le tracking d'erreurs
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
# Organisation Sentry
SENTRY_ORG=votre-org-sentry
# Projet Sentry
SENTRY_PROJECT=votre-projet-sentry
# Token d'authentification Sentry (pour les source maps)
SENTRY_AUTH_TOKEN=sntrys_...
# Activer le monitoring de performance
ENABLE_PERFORMANCE_MONITORING=true|false
# Activer le tracking d'erreurs
ENABLE_ERROR_TRACKING=true|false
```

### Base de Données (Optionnel)

```bash
# URL de base de données directe (si différente de Supabase)
DATABASE_URL=postgresql://user:password@host:port/database
```

## Configuration par Environnement

### Développement Local (.env.local)

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_NAME="مناحل الرحيق - Dev"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
NEXT_PUBLIC_ENABLE_CHATBOT=false
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Staging

```bash
NODE_ENV=staging
NEXT_PUBLIC_APP_NAME="مناحل الرحيق - Staging"
NEXT_PUBLIC_SITE_URL=https://staging-manahal-alrahiq.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_key
JWT_SECRET=your_staging_jwt_secret
NEXTAUTH_SECRET=your_staging_nextauth_secret
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Production

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_NAME="مناحل الرحيق"
NEXT_PUBLIC_SITE_URL=https://manahal-alrahiq.com
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key
JWT_SECRET=your_prod_jwt_secret
NEXTAUTH_SECRET=your_prod_nextauth_secret
UPLOADTHING_TOKEN=your_prod_uploadthing_token
NEXT_PUBLIC_SENTRY_DSN=your_prod_sentry_dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=manahal-alrahiq
SENTRY_AUTH_TOKEN=your_sentry_auth_token
LOG_LEVEL=warn
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ERROR_TRACKING=true
NEXT_PUBLIC_ENABLE_CHATBOT=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_A11Y=true
```

## Validation des Variables

L'application valide automatiquement les variables d'environnement au démarrage.
Les variables manquantes ou invalides provoqueront une erreur de démarrage.

### Script de validation

```bash
# Vérifier les variables d'environnement
npm run validate:env

# Ou utiliser le script de validation
./scripts/validate-env.sh
```

### Variables critiques

Ces variables DOIVENT être définies en production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`

## Sécurité

### Bonnes pratiques

1. **Jamais** committer les fichiers `.env` avec des vraies valeurs
2. Utiliser des secrets forts (minimum 32 caractères)
3. Différencier les secrets entre environnements
4. Renouveler les secrets régulièrement
5. Utiliser des services de gestion de secrets en production

### Génération de secrets

```bash
# Générer un secret JWT/NextAuth
openssl rand -base64 32

# Ou avec Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Dépannage

### Erreurs communes

1. **Variables manquantes**: Vérifier que toutes les variables obligatoires sont
   définies
2. **Secrets invalides**: Vérifier la longueur et le format des secrets
3. **URLs incorrectes**: Vérifier les URLs Supabase et du site
4. **Permissions**: Vérifier les permissions des clés Supabase

### Outils de debug

```bash
# Afficher les variables d'environnement (sans les secrets)
npm run env:check

# Tester la connexion Supabase
npm run test:supabase

# Valider la configuration complète
npm run validate:config
```

---

**Important**: Gardez ce document à jour lors de l'ajout de nouvelles variables
d'environnement.
