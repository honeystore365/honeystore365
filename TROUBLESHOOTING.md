# Guide de Dépannage - HoneyStore

## Problèmes d'Authentification

### Erreur: "Could not authenticate user"

**Causes possibles:**
1. Variables d'environnement Supabase manquantes ou incorrectes
2. Projet Supabase inactif ou mal configuré
3. Problème de réseau ou de connectivité

**Solutions:**

#### 1. Vérifier les variables d'environnement
```bash
# Exécuter le diagnostic
node debug-auth.js
```

#### 2. Créer/Vérifier le fichier .env.local
```bash
# Copier le fichier exemple
cp .env.example .env.local

# Éditer avec vos vraies valeurs Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 3. Redémarrer le serveur
```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer
npm run dev
```

### Erreur: "Cannot read properties of undefined (reading 'from')"

**Cause:** Client Supabase non initialisé correctement

**Solution:**
1. Vérifier que les variables d'environnement sont définies
2. Redémarrer le serveur de développement
3. Vider le cache du navigateur

### Erreur: "Module not found: Can't resolve '@/lib/supabase...'"

**Cause:** Imports incorrects ou fichiers manquants

**Solution:**
1. Vérifier que tous les fichiers Supabase existent
2. Utiliser les imports corrects selon le contexte (client/serveur)

## Test Rapide

```bash
# Tester les corrections d'authentification
node test-auth-fix.js
```

## Pages de Test Disponibles

- `/` - Page d'accueil
- `/auth/login` - Page de connexion
- `/admin` - Interface d'administration (nécessite authentification)
- `/demo-badge` - Test du badge panier

## Logs Utiles

### Navigateur (F12 > Console)
- Erreurs JavaScript
- Erreurs de réseau
- Messages de Supabase

### Terminal (serveur)
- Erreurs de compilation
- Erreurs d'authentification serveur
- Messages de logging

## Support

Si les problèmes persistent:
1. Vérifiez votre dashboard Supabase
2. Testez la connectivité à votre projet Supabase
3. Vérifiez les paramètres RLS (Row Level Security)
4. Consultez les logs Supabase dans le dashboard