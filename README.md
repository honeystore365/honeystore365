# 🍯 HoneyStore365 - Admin Dashboard avec InstantDB

E-commerce admin dashboard pour miel et dattes, alimenté par [InstantDB](https://instantdb.com).

## ✅ Ce qui a été configuré

### Schema InstantDB

| Entity | Description |
|--------|-------------|
| `products` | Produits (miel, dattes) avec prix, stock, images |
| `categories` | Catégories de produits |
| `orders` | Commandes clients avec statuts |
| `orderItems` | Lignes de commande (produits × quantités) |
| `cartItems` | Panier actif des clients |
| `reviews` | Avis clients |

### Pages Admin

| Route | Fonctionnalités |
|-------|-----------------|
| `/admin` | Dashboard avec stats et CA |
| `/admin/products` | CRUD produits, toggle disponibilité |
| `/admin/orders` | Gestion commandes, changement statut |
| `/admin/categories` | CRUD catégories |

### Avantages par rapport à Supabase

| Critère | Supabase (ancien) | InstantDB (nouveau) |
|---------|-------------------|---------------------|
| **Code** | ~300 lignes/page | ~150 lignes/page |
| **Real-time** | Manuel avec `useEffect` | Automatique avec `useQuery` |
| **Sleep mode** | ❌ Oui (pause inactivité) | ✅ Non (toujours actif) |
| **Offline** | ❌ Non | ✅ Oui |
| **Typage** | Manuel | Auto-généré |
| **State** | Manual `useState` | Auto-sync |

## 🚀 Démarrage

```bash
cd /home/workspace/honeystore
npm run dev
```

L'app sera disponible sur `http://localhost:3000`

## 📊 Comparaison Code

### Avant (Supabase) - 80 lignes
```tsx
const [products, setProducts] = useState([])
useEffect(() => {
  supabase.from('products').select().then(({data}) => setProducts(data))
}, [])
// + re-fetch après chaque modification
```

### Après (InstantDB) - 3 lignes
```tsx
const { products } = db.useQuery({ products: {} })
// Auto-updates quand data change!
```

## 🔐 Authentification

- Magic codes par email (pas de mot de passe)
- Rôles: `admin` ou `customer`
- Pour devenir admin, modifier le champ `role` d'un user à `"admin"`

## 💰 Prix en millimes

Les prix sont stockés en **millimes** (1 DT = 1000 millimes) pour éviter les erreurs de floating point.

```typescript
// Affichage
const priceDT = priceMillimes / 1000  // 25000 → 25.000 DT
```

## 🛠️ Commandes utiles

```bash
# Push schema changes
npx instant-cli push schema --yes

# Push permission changes  
npx instant-cli push perms --yes

# Query data via CLI
npx instant-cli query '{ products: {} }' --admin

# Reset database (attention!)
npx instant-cli delete-all --yes
```

## 📁 Structure du projet

```
honeystore/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── products/page.tsx  # Gestion produits
│   │   │   ├── orders/page.tsx    # Gestion commandes
│   │   │   ├── categories/page.tsx # Gestion catégories
│   │   │   └── layout.tsx         # Layout avec sidebar
│   │   └── layout.tsx
│   ├── lib/
│   │   └── db.ts                  # Init InstantDB
│   ├── instant.schema.ts          # Schema de données
│   └── instant.perms.ts          # Permissions
└── package.json
```

## 🔗 Liens utiles

- [InstantDB Console](https://instantdb.com/dash?s=main&app=68720b42-a379-4ba1-939e-f73b2c877b77)
- [Documentation Instant](https://instantdb.com/docs)
- [GitHub du projet original](https://github.com/honeystore365/honeystore365)

## 📝 TODO

- [ ] Intégrer les catégories dans le formulaire produit
- [ ] Ajouter upload d'images (Instant Storage)
- [ ] Créer seed data pour tester
- [ ] Ajouter filtres avancés sur les commandes
- [ ] Exporter commandes en CSV
