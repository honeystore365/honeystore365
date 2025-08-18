# Guide de Maintenance - مناحل الرحيق

Guide complet pour la maintenance et l'administration de l'application en
production.

## Table des Matières

1. [Maintenance Préventive](#maintenance-préventive)
2. [Monitoring et Alertes](#monitoring-et-alertes)
3. [Sauvegardes](#sauvegardes)
4. [Mises à Jour](#mises-à-jour)
5. [Gestion des Incidents](#gestion-des-incidents)
6. [Performance et Optimisation](#performance-et-optimisation)
7. [Sécurité](#sécurité)
8. [Documentation](#documentation)

## Maintenance Préventive

### Tâches Quotidiennes

```bash
# Vérification de santé automatisée
./scripts/health-check.sh https://manahal-alrahiq.com production

# Vérification des logs d'erreurs
# Vercel
vercel logs --since=24h | grep ERROR

# Supabase
supabase logs --type=database --since=1d
```

### Tâches Hebdomadaires

```bash
# Sauvegarde complète
./scripts/backup.sh production full

# Vérification des métriques de performance
# Accéder au dashboard de monitoring
open https://manahal-alrahiq.com/monitoring

# Vérification des certificats SSL
./scripts/health-check.sh https://manahal-alrahiq.com production | grep SSL

# Nettoyage des logs anciens
find logs/ -name "*.log" -mtime +30 -delete
```

### Tâches Mensuelles

```bash
# Mise à jour des dépendances
npm audit
npm update

# Vérification de sécurité
npm audit --audit-level high

# Analyse des performances
npm run analyze

# Révision des variables d'environnement
./scripts/validate-env.sh production

# Vérification de l'espace de stockage Supabase
# Via le dashboard Supabase
```

### Tâches Trimestrielles

- Révision des politiques de sécurité
- Mise à jour des secrets (JWT, API keys)
- Audit de sécurité complet
- Révision des sauvegardes et test de restauration
- Planification des mises à jour majeures

## Monitoring et Alertes

### Métriques Clés à Surveiller

#### Performance

- **Response Time**: < 2s (95th percentile)
- **Core Web Vitals**:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- **Uptime**: > 99.9%

#### Business

- **Conversion Rate**: Taux de conversion des visiteurs
- **Cart Abandonment**: Taux d'abandon de panier
- **Revenue**: Revenus quotidiens/hebdomadaires
- **User Engagement**: Sessions, pages vues

#### Technique

- **Error Rate**: < 1%
- **Database Response Time**: < 500ms
- **Memory Usage**: < 80%
- **Storage Usage**: Supabase storage

### Configuration des Alertes

#### Sentry (Erreurs)

```javascript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Alertes par email pour les erreurs critiques
  beforeSend(event) {
    if (event.level === 'error') {
      // Logique d'alerte personnalisée
    }
    return event;
  },
});
```

#### Vercel (Performance)

- Configurer les alertes dans le dashboard Vercel
- Seuils recommandés:
  - Response time > 3s
  - Error rate > 5%
  - Build failures

#### Supabase (Base de données)

- Alertes sur l'utilisation de la bande passante
- Alertes sur les connexions simultanées
- Alertes sur l'espace de stockage

### Dashboard de Monitoring

Accédez au dashboard personnalisé: `/monitoring`

Métriques affichées:

- Performance en temps réel
- Erreurs récentes
- Métriques business
- Statut des services externes

## Sauvegardes

### Stratégie de Sauvegarde

#### Fréquence

- **Base de données**: Quotidienne (automatique)
- **Fichiers**: Hebdomadaire
- **Configuration**: À chaque déploiement

#### Rétention

- **Quotidiennes**: 30 jours
- **Hebdomadaires**: 12 semaines
- **Mensuelles**: 12 mois

### Scripts de Sauvegarde

```bash
# Sauvegarde automatisée quotidienne
# Ajouter au crontab
0 2 * * * /path/to/scripts/backup.sh production full

# Sauvegarde manuelle
./scripts/backup.sh production full

# Vérification des sauvegardes
ls -la backups/ | grep $(date +%Y%m%d)
```

### Test de Restauration

```bash
# Test mensuel de restauration (environnement de test)
./scripts/restore.sh staging backup_file.sql.gz

# Vérification de l'intégrité
./scripts/health-check.sh https://staging-manahal-alrahiq.vercel.app staging
```

## Mises à Jour

### Processus de Mise à Jour

#### 1. Préparation

```bash
# Créer une branche de mise à jour
git checkout -b update/dependencies-$(date +%Y%m%d)

# Vérifier les dépendances obsolètes
npm outdated

# Vérifier les vulnérabilités
npm audit
```

#### 2. Mise à Jour des Dépendances

```bash
# Mises à jour mineures (sécurisées)
npm update

# Mises à jour majeures (une par une)
npm install package@latest

# Vérifier les breaking changes
npm test
```

#### 3. Tests

```bash
# Tests complets
npm run test:ci
npm run lint
npm run typecheck
npm run build
```

#### 4. Déploiement Progressif

```bash
# 1. Staging
./scripts/deploy.sh staging vercel

# 2. Tests en staging
./scripts/health-check.sh https://staging-manahal-alrahiq.vercel.app staging

# 3. Production (si tests OK)
./scripts/deploy.sh production vercel
```

### Calendrier de Mises à Jour

- **Sécurité**: Immédiatement
- **Mineures**: Hebdomadaire
- **Majeures**: Mensuelle (planifiée)
- **Framework (Next.js)**: Trimestrielle

## Gestion des Incidents

### Classification des Incidents

#### Critique (P0)

- Site inaccessible
- Perte de données
- Faille de sécurité
- **SLA**: Résolution < 1h

#### Majeur (P1)

- Fonctionnalité principale cassée
- Performance dégradée (>5s)
- Erreurs affectant >10% des utilisateurs
- **SLA**: Résolution < 4h

#### Mineur (P2)

- Fonctionnalité secondaire cassée
- Problèmes d'affichage
- **SLA**: Résolution < 24h

### Procédure d'Incident

#### 1. Détection

- Alertes automatiques (Sentry, Vercel)
- Rapports utilisateurs
- Monitoring proactif

#### 2. Évaluation

```bash
# Vérification rapide
./scripts/health-check.sh https://manahal-alrahiq.com production

# Vérification des logs
vercel logs --since=1h | grep ERROR
```

#### 3. Communication

- Notification équipe (Slack, email)
- Page de statut (si nécessaire)
- Communication utilisateurs

#### 4. Résolution

```bash
# Rollback rapide si nécessaire
vercel rollback

# Ou correction et redéploiement
git revert <commit>
./scripts/deploy.sh production vercel
```

#### 5. Post-Mortem

- Analyse des causes
- Actions préventives
- Documentation des leçons apprises

### Contacts d'Urgence

- **Développeur Principal**: [contact]
- **Admin Système**: [contact]
- **Support Supabase**: support@supabase.io
- **Support Vercel**: support@vercel.com

## Performance et Optimisation

### Métriques de Performance

#### Core Web Vitals

```bash
# Audit Lighthouse
npx lighthouse https://manahal-alrahiq.com --output=json

# Analyse du bundle
npm run analyze
```

#### Base de Données

```sql
-- Requêtes lentes (Supabase)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Index manquants
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public';
```

### Optimisations Recommandées

#### Frontend

- Optimisation des images (WebP, AVIF)
- Code splitting
- Lazy loading
- Service Worker pour le cache

#### Backend

- Optimisation des requêtes SQL
- Mise en cache (Redis si nécessaire)
- Compression des réponses
- CDN pour les assets statiques

#### Base de Données

- Index sur les colonnes fréquemment requêtées
- Nettoyage des données obsolètes
- Optimisation des requêtes N+1

## Sécurité

### Audit de Sécurité

#### Mensuel

```bash
# Vulnérabilités npm
npm audit --audit-level high

# Vérification des headers de sécurité
./scripts/health-check.sh https://manahal-alrahiq.com production | grep -A 10 "security headers"

# Vérification SSL
openssl s_client -connect manahal-alrahiq.com:443 -servername manahal-alrahiq.com
```

#### Trimestriel

- Audit des permissions Supabase
- Révision des politiques RLS
- Test de pénétration (si budget disponible)
- Mise à jour des secrets

### Checklist Sécurité

- [ ] Certificats SSL valides
- [ ] Headers de sécurité configurés
- [ ] Secrets rotés régulièrement
- [ ] Logs de sécurité surveillés
- [ ] Sauvegardes chiffrées
- [ ] Accès administrateur limité
- [ ] 2FA activé sur tous les comptes

## Documentation

### Documentation à Maintenir

#### Technique

- Architecture système
- Procédures de déploiement
- Configuration des environnements
- API documentation

#### Opérationnelle

- Procédures de maintenance
- Gestion des incidents
- Contacts et escalade
- Calendrier de maintenance

### Outils de Documentation

- **Code**: Commentaires inline + JSDoc
- **API**: OpenAPI/Swagger
- **Procédures**: Markdown dans `/docs`
- **Architecture**: Diagrammes Mermaid

### Mise à Jour de la Documentation

- À chaque changement d'architecture
- Après chaque incident majeur
- Révision trimestrielle complète
- Formation équipe sur les changements

## Automatisation

### Scripts d'Automatisation

```bash
# Maintenance quotidienne
./scripts/daily-maintenance.sh

# Rapport hebdomadaire
./scripts/weekly-report.sh

# Nettoyage mensuel
./scripts/monthly-cleanup.sh
```

### Cron Jobs Recommandés

```bash
# Sauvegarde quotidienne à 2h
0 2 * * * /path/to/scripts/backup.sh production full

# Health check toutes les 5 minutes
*/5 * * * * /path/to/scripts/health-check.sh https://manahal-alrahiq.com production

# Nettoyage hebdomadaire le dimanche à 3h
0 3 * * 0 /path/to/scripts/cleanup.sh

# Rapport mensuel le 1er à 9h
0 9 1 * * /path/to/scripts/monthly-report.sh
```

## Ressources

### Dashboards

- **Application**: https://manahal-alrahiq.com/monitoring
- **Vercel**: https://vercel.com/dashboard
- **Supabase**: https://app.supabase.com
- **Sentry**: https://sentry.io

### Documentation

- [Guide de déploiement](./README.md)
- [Variables d'environnement](./environment-variables.md)
- [Procédures d'urgence](./emergency-procedures.md)

### Contacts Support

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Sentry Support**: https://sentry.io/support

---

**Note**: Ce guide doit être révisé et mis à jour régulièrement pour rester
pertinent.
