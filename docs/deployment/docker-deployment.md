# Déploiement Docker - مناحل الرحيق

Guide pour déployer l'application avec Docker et Docker Compose.

## Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- Projet Supabase configuré

## Configuration Docker

### 1. Dockerfile

Créez `Dockerfile` à la racine du projet:

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_APP_NAME
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Docker Compose

Créez `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
        - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        - NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
        - NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
        - SENTRY_ORG=${SENTRY_ORG}
        - SENTRY_PROJECT=${SENTRY_PROJECT}
        - SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - UPLOADTHING_TOKEN=${UPLOADTHING_TOKEN}
      - NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - NEXT_PUBLIC_ENABLE_ANALYTICS=${NEXT_PUBLIC_ENABLE_ANALYTICS:-true}
      - NEXT_PUBLIC_ENABLE_CHATBOT=${NEXT_PUBLIC_ENABLE_CHATBOT:-true}
      - NEXT_PUBLIC_ENABLE_A11Y=${NEXT_PUBLIC_ENABLE_A11Y:-true}
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optionnel: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

  # Optionnel: Redis pour le cache
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

### 3. Configuration Nginx (Optionnel)

Créez `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name votre-domaine.com www.votre-domaine.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name votre-domaine.com www.votre-domaine.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # Rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_cache_bypass $http_upgrade;
        }

        # Static files caching
        location /_next/static/ {
            proxy_pass http://app;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }

        location /static/ {
            proxy_pass http://app;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }
}
```

## Variables d'Environnement

### 1. Fichier .env.docker

```bash
# .env.docker
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=مناحل الرحيق
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_jwt_secret_32_chars_minimum
NEXTAUTH_SECRET=your_nextauth_secret_32_chars_minimum
UPLOADTHING_TOKEN=your_uploadthing_token
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=manahal-alrahiq
SENTRY_AUTH_TOKEN=your_sentry_auth_token
LOG_LEVEL=info
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHATBOT=true
NEXT_PUBLIC_ENABLE_A11Y=true
```

### 2. Chargement des Variables

```bash
# Charger les variables d'environnement
export $(cat .env.docker | xargs)
```

## Déploiement

### 1. Build et Run

```bash
# Build de l'image
docker build -t manahal-alrahiq .

# Run du container
docker run -p 3000:3000 --env-file .env.docker manahal-alrahiq

# Ou avec Docker Compose
docker-compose --env-file .env.docker up -d
```

### 2. Scripts de Déploiement

Créez `scripts/docker-deploy.sh`:

```bash
#!/bin/bash
# scripts/docker-deploy.sh

set -e

ENVIRONMENT=${1:-production}
ENV_FILE=".env.${ENVIRONMENT}"

echo "Déploiement Docker pour l'environnement: $ENVIRONMENT"

# Vérifier que le fichier d'environnement existe
if [ ! -f "$ENV_FILE" ]; then
    echo "Erreur: Fichier d'environnement $ENV_FILE non trouvé"
    exit 1
fi

# Charger les variables d'environnement
export $(cat $ENV_FILE | xargs)

# Arrêter les containers existants
echo "Arrêt des containers existants..."
docker-compose down

# Build de la nouvelle image
echo "Build de l'image..."
docker-compose build --no-cache

# Démarrage des services
echo "Démarrage des services..."
docker-compose --env-file $ENV_FILE up -d

# Vérification de santé
echo "Vérification de santé..."
sleep 30
curl -f http://localhost:3000/api/health || {
    echo "Erreur: L'application ne répond pas"
    docker-compose logs app
    exit 1
}

echo "Déploiement terminé avec succès!"
```

### 3. Mise à Jour

```bash
#!/bin/bash
# scripts/docker-update.sh

echo "Mise à jour de l'application..."

# Pull du code
git pull origin main

# Rebuild et redémarrage
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Nettoyage des images inutilisées
docker image prune -f

echo "Mise à jour terminée!"
```

## Production avec Docker Swarm

### 1. Configuration Swarm

```yaml
# docker-stack.yml
version: '3.8'

services:
  app:
    image: manahal-alrahiq:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    secrets:
      - jwt_secret
      - nextauth_secret
      - supabase_service_key
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    networks:
      - app-network

secrets:
  jwt_secret:
    external: true
  nextauth_secret:
    external: true
  supabase_service_key:
    external: true

networks:
  app-network:
    driver: overlay
```

### 2. Déploiement Swarm

```bash
# Initialiser Swarm
docker swarm init

# Créer les secrets
echo "your_jwt_secret" | docker secret create jwt_secret -
echo "your_nextauth_secret" | docker secret create nextauth_secret -
echo "your_supabase_key" | docker secret create supabase_service_key -

# Déployer la stack
docker stack deploy -c docker-stack.yml manahal-stack

# Vérifier le déploiement
docker stack services manahal-stack
```

## Monitoring et Logs

### 1. Logs

```bash
# Logs de l'application
docker-compose logs -f app

# Logs avec timestamp
docker-compose logs -f -t app

# Logs des dernières 100 lignes
docker-compose logs --tail=100 app
```

### 2. Monitoring

```bash
# Stats des containers
docker stats

# Santé des services
docker-compose ps

# Inspection d'un container
docker inspect <container_id>
```

### 3. Health Checks

Ajoutez à votre application une route de santé:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Vérifications de santé
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.NEXT_PUBLIC_APP_VERSION,
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    );
  }
}
```

## Sécurité

### 1. Secrets Management

```bash
# Utiliser Docker secrets en production
docker secret create jwt_secret jwt_secret.txt
docker secret create db_password db_password.txt
```

### 2. Network Security

```yaml
# Isolation réseau
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

### 3. User Permissions

```dockerfile
# Utiliser un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
```

## Dépannage

### Problèmes Courants

1. **Build Failed**

   ```bash
   # Vérifier les logs de build
   docker-compose build --no-cache --progress=plain
   ```

2. **Container ne démarre pas**

   ```bash
   # Vérifier les logs
   docker-compose logs app

   # Vérifier la configuration
   docker-compose config
   ```

3. **Problèmes de réseau**

   ```bash
   # Vérifier les réseaux
   docker network ls

   # Inspecter un réseau
   docker network inspect <network_name>
   ```

### Nettoyage

```bash
# Nettoyer les containers arrêtés
docker container prune

# Nettoyer les images inutilisées
docker image prune

# Nettoyage complet
docker system prune -a
```

---

**Note**: Ce guide couvre le déploiement Docker basique et avancé. Adaptez selon
vos besoins spécifiques.
