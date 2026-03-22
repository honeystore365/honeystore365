# 🚀 Déploiement Immédiat - HoneyStore365

## Option 1: Déploiement Manuel (Recommandé)

### Étape 1: Créer repo GitHub

```bash
# 1. Va sur https://github.com/new
# 2. Crée un repo: honeystore365-v2
# 3. Copie l'URL (ex: https://github.com/TON_USER/honeystore365-v2.git)

# 4. Dans le terminal:
cd /home/workspace/honeystore
git remote remove origin 2>/dev/null
git remote add origin https://github.com/TON_USER/honeystore365-v2.git
git branch -m main
git push -u origin main
```

### Étape 2: Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com)
2. **"Add New Project"**
3. Importe depuis GitHub → `honeystore365-v2`
4. Framework: **Next.js**
5. **Environment Variables:**
   ```
   NEXT_PUBLIC_INSTANT_APP_ID = 68720b42-a379-4ba1-939e-f73b2c877b77
   INSTANT_ADMIN_TOKEN = 0d0b1fe1-a270-4779-ba17-4e30eb476b54
   ```
6. **Deploy** 🎉

---

## Option 2: Déploiement Direct (Sans GitHub)

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
cd /home/workspace/honeystore
vercel --prod

# Répondre aux questions:
# - Set up "honeystore"? [Y/n] → Y
# - Which scope? [ton-compte] → Entrée
# - Link to existing project? [y/N] → N
# - What's your project name? [honeystore] → honeystore365-v2
```

---

## ⚡ Option 3: ZIP et Upload

```bash
# Créer un zip
cd /home/workspace
zip -r honeystore-v2.zip honeystore/ -x "honeystore/node_modules/*" "honeystore/.git/*"

# Le fichier est: /home/workspace/honeystore-v2.zip
```

1. Va sur [vercel.com](https://vercel.com)
2. **"Add New Project"**
3. **"Import Git Repository"** → Switch to **"Upload"**
4. Upload `honeystore-v2.zip`
5. Configure les env vars
6. Deploy

---

## 🔧 Post-Déploiement

### 1. Devenir Admin

1. Va sur ton URL Vercel: `https://honeystore365-v2.vercel.app`
2. Crée un compte avec ton email
3. Va sur [Console Instant](https://instantdb.com/dash?s=main&app=68720b42-a379-4ba1-939e-f73b2c877b77)
4. Trouve ton user → Ajoute `role: "admin"`

### 2. Ajouter données test

1. `/admin/categories` → Crée "Miel", "Dattes"
2. `/admin/products` → Ajoute un produit test
3. `/admin/orders` → La page s'ouvre

### 3. Custom Domain (Optionnel)

1. Vercel Dashboard → Settings → Domains
2. Ajoute: `ton-domaine.com` ou `store.ton-domaine.com`
3. Configure DNS selon instructions

---

## 📁 Structure du projet

```
honeystore/
├── src/
│   ├── app/admin/          # Dashboard complet
│   ├── components/admin/   # ImageUploader, InvoicePDF
│   ├── instant.schema.ts   # Schema données
│   └── instant.perms.ts    # Permissions
├── scripts/
│   └── migrate-supabase.ts # Script migration (si besoin futur)
└── README.md               # Documentation
```

## ✅ Vérification finale

Après déploiement, teste:
- [ ] `/admin` → Dashboard avec stats
- [ ] `/admin/products` → CRUD produits
- [ ] `/admin/orders` → Workflow commandes
- [ ] Upload d'image sur un produit
- [ ] Génération facture PDF

---

**Questions?** Le code est prêt, il ne reste que le push/deploy ! 🎉
