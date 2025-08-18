# Guide de Configuration des Factures PDF

## 🎯 Fonctionnalités Implémentées

### ✅ Conformité Comptable Tunisienne et Française

- **Numérotation**: Format INV-YYYYMM-XXXXXX
- **Informations légales**: Registre commerce, matricule fiscal, code activité
- **TVA**: Calcul automatique à 20% (norme tunisienne)
- **Mentions obligatoires**: Conditions de paiement, coordonnées bancaires

### ✅ Design Professionnel

- **Format**: A4 avec marges conformes
- **Bilingue**: Arabe (principal) et Français
- **Sections**: En-tête, détails client, articles, totaux, signatures
- **Impression**: Optimisé pour l'impression PDF

## 🔧 Configuration de l'Entreprise

### Fichier: `src/lib/pdf/invoice-generator.ts`

```javascript
const COMPANY_CONFIG = {
  name: 'مناحل الرحيق',
  nameEn: 'Honey Store 365',
  address: 'شارع الحبيب بورقيبة، تونس العاصمة',
  addressEn: 'Avenue Habib Bourguiba, Tunis',
  phone: '+216 XX XXX XXX',
  email: 'info@honeystore365.com',
  website: 'www.honeystore365.com',

  // Informations légales tunisiennes
  registreCommerce: 'B123456789',
  matriculeFiscal: '1234567/A/M/000',
  codeActivite: '47.91.1', // Commerce de détail par correspondance
  tva: '20%', // TVA standard en Tunisie

  // Coordonnées bancaires
  rib: 'TN59 1234 5678 9012 3456 7890 12',
  banque: 'Banque Centrale de Tunisie',
};
```

### ⚠️ À Personnaliser

1. **Nom et adresse de l'entreprise**
2. **Numéros de téléphone réels**
3. **Informations légales officielles**
4. **Coordonnées bancaires réelles**
5. **Logo de l'entreprise** (actuellement emoji 🍯)

## 🚀 Utilisation

### Dans l'Interface Admin

1. Aller sur `/admin/orders/[id]`
2. Cliquer sur "تحميل فاتورة PDF"
3. Le PDF se télécharge automatiquement

### Via API

```javascript
POST /api/admin/orders/generate-invoice
{
  "orderId": "uuid-de-la-commande"
}
```

## 📋 Structure de la Facture

### 1. En-tête

- Logo et nom de l'entreprise
- Informations légales complètes
- Adresse et contacts

### 2. Informations Facture

- Numéro de facture unique
- Date d'émission
- Statut de la commande

### 3. Informations Client

- Nom complet
- Adresse de livraison
- Contacts

### 4. Détail des Articles

- Description des produits
- Quantités et prix unitaires
- Totaux par ligne

### 5. Calculs Conformes

- Total Hors Taxe (HT)
- Frais de livraison
- TVA (20%)
- **Total TTC**

### 6. Informations Légales

- Conditions de paiement
- Mentions légales
- Coordonnées bancaires

### 7. Signatures

- Espace pour signature client
- Espace pour cachet vendeur

## 🔧 Dépendances Techniques

### Packages Installés

```bash
npm install puppeteer @types/puppeteer
```

### Variables d'Environnement Requises

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 🧪 Tests

### Script de Test

```bash
node test-pdf-simple.js
```

### Vérifications Automatiques

- ✅ Génération PDF réussie
- ✅ Taille du fichier > 0
- ✅ Type MIME correct
- ✅ Téléchargement fonctionnel

## 🎨 Personnalisation Avancée

### Modifier le Style

Éditer les styles CSS dans `generateInvoiceHTML()`:

- Couleurs de l'entreprise
- Polices personnalisées
- Layout spécifique

### Ajouter des Champs

1. Modifier l'interface `OrderData`
2. Mettre à jour la requête Supabase
3. Ajouter les champs dans le HTML

### Langues Supplémentaires

Ajouter des traductions dans les fonctions utilitaires:

- `getStatusText()`
- `getPaymentMethodText()`

## 🔒 Sécurité

### Authentification

- Utilise la service key Supabase
- Accès admin uniquement
- Validation des données

### Données Sensibles

- Pas de stockage des PDFs
- Génération à la demande
- Nettoyage automatique des ressources

## 📞 Support

### En cas de problème

1. Vérifier que Puppeteer est installé
2. Contrôler les variables d'environnement
3. Tester avec `test-pdf-simple.js`
4. Vérifier les logs serveur

### Optimisations Possibles

- Cache des PDFs générés
- Compression des images
- Optimisation des polices
- Templates multiples

---

**Note**: Cette implémentation respecte les normes comptables tunisiennes et
françaises. Adaptez les informations légales selon votre situation réelle.
