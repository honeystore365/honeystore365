# Déploiement sur Vercel - HoneyStore365

## 🚀 Guide rapide

### 1. Connexion GitHub

1. Push ton projet sur GitHub:
```bash
cd /home/workspace/honeystore
git init
git add .
git commit -m "Initial: HoneyStore365 with InstantDB"
# Créer repo sur GitHub puis:
git remote add origin https://github.com/ton-username/honeystore365.git
git push -u origin main
```

### 2. Configuration Vercel

1. Va sur [Vercel Dashboard](https://vercel.com)
2. Clique **"Add New Project"**
3. Importe depuis GitHub → sélectionne `honeystore365`
4. Framework: **Next.js** (détecté auto)
5. Clique **"Deploy"**

### 3. Variables d'environnement

Dans les Settings du projet Vercel → **Environment Variables**:

| Variable | Value | Type |
|----------|-------|------|
| `NEXT_PUBLIC_INSTANT_APP_ID` | `68720b42-a379-4ba1-939e-f73b2c877b77` | Production |
| `INSTANT_ADMIN_TOKEN` | `0d0b1fe1-a270-4779-ba17-4e30eb476b54` | Production |

⚠️ **Important:** `INSTANT_ADMIN_TOKEN` est secret! Ne le mets JAMAIS dans le code.

### 4. Redeploy

Après avoir ajouté les env vars:
- Va dans **Deployments**
- Clique les trois points sur le dernier deploy
- **"Redeploy"**

## 🔗 Domaine personnalisé

Si tu veux garder ton ancien domaine:
1. Settings → Domains
2. Ajoute: `honeystore365.vercel.app` (ou ton domaine custom)
3. Configure les DNS si besoin

## 🧪 Test après déploiement

1. **Accès dashboard:** `https://ton-url.vercel.app/admin`
2. **Créer un compte:** Utilise ton email
3. **Devenir admin:** Va sur [Console Instant](https://instantdb.com/dash)
4. **Ajouter des données de test:**
   - Crée une catégorie "Miel"
   - Crée un produit "Miel de fleurs"
   - Vérifie que ça apparait en temps réel

## 🛠️ Troubleshooting

### "Build failed"
```bash
# Test en local d'abord
cd /home/workspace/honeystore
npm run build
```

### "Invalid Instant App ID"
- Vérifie que `NEXT_PUBLIC_INSTANT_APP_ID` est bien dans les env vars
- Redeploy après correction

### "Permission denied"
```bash
# Push les permissions
npx instant-cli login
npx instant-cli push perms --yes
```

### Pages blanches
- Vérifie la console navigateur (F12)
- Check que `schema` est bien passé à `init()`

## 📊 Monitoring

Depuis [Console Instant](https://instantdb.com/dash):
- Usage (users, storage, bandwidth)
- Real-time connections
- Queries per second

## 🔄 Workflow de mise à jour

```bash
# 1. Modifier le code
# 2. Test local
npm run dev

# 3. Commit & push
git add .
git commit -m "Update: ..."
git push

# 4. Vercel deploy auto depuis GitHub!
```

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **InstantDB Docs:** https://instantdb.com/docs
- **Next.js on Vercel:** https://nextjs.org/docs/deployment

---

**Ton dashboard sera live en ~2 minutes après push!** 🎉
