# Règles Métier - Génération de Factures

## 🎯 Principe Général

Les factures ne peuvent être générées que pour les commandes qui ont une valeur
commerciale réelle.

## ✅ Statuts Autorisés pour PDF

### 1. **Pending Confirmation** (في انتظار التأكيد)

- ✅ **Facture autorisée**
- **Justification** : Commande passée, engagement client
- **Usage** : Facture proforma, devis

### 2. **Confirmed** (مؤكد)

- ✅ **Facture autorisée**
- **Justification** : Commande confirmée, transaction validée
- **Usage** : Facture officielle

### 3. **Delivered** (تم التوصيل)

- ✅ **Facture autorisée**
- **Justification** : Transaction complète
- **Usage** : Facture finale, comptabilité

## ❌ Statuts Interdits pour PDF

### 4. **Cancelled** (ملغي)

- ❌ **Facture INTERDITE**
- **Justification** : Aucune transaction réelle
- **Conséquences** : Pas de valeur comptable

## 🔧 Implémentation Technique

### Interface Utilisateur

```typescript
const canGeneratePDF = !['Cancelled'].includes(currentStatus);

{canGeneratePDF && (
  <Button onClick={generatePDF}>
    تحميل فاتورة PDF
  </Button>
)}

{currentStatus === 'Cancelled' && (
  <div className="message-cancelled">
    📋 لا يمكن إنشاء فاتورة للطلبات الملغاة
  </div>
)}
```

### Validation API

```typescript
if (order.status === 'Cancelled') {
  return NextResponse.json(
    {
      error: 'Cannot generate invoice for cancelled orders',
      message: 'لا يمكن إنشاء فاتورة للطلبات الملغاة',
    },
    { status: 400 }
  );
}
```

## 📋 Cas d'Usage

### Scénario 1 : Commande Normale

1. Client passe commande → **Pending Confirmation** ✅ PDF possible
2. Admin confirme → **Confirmed** ✅ PDF possible
3. Livraison effectuée → **Delivered** ✅ PDF possible

### Scénario 2 : Commande Annulée

1. Client passe commande → **Pending Confirmation** ✅ PDF possible
2. Problème détecté → **Cancelled** ❌ PDF impossible
3. **Résultat** : Pas de facture générée

### Scénario 3 : Annulation Après Confirmation

1. Commande confirmée → **Confirmed** ✅ PDF possible
2. Annulation nécessaire → **Cancelled** ❌ PDF impossible
3. **Note** : Les PDFs générés avant annulation restent valides

## 🏛️ Conformité Comptable

### Normes Tunisiennes

- **Article 9** : Seules les transactions réelles génèrent des factures
- **Code TVA** : Pas de TVA sur transactions annulées
- **Registre** : Les commandes annulées ne figurent pas au registre

### Normes Françaises

- **Code de Commerce** : Factures uniquement pour ventes réelles
- **TVA** : Pas de déclaration pour transactions annulées
- **Comptabilité** : Pas d'écriture pour commandes annulées

## 🔒 Sécurité et Contrôles

### Validation Double

1. **Frontend** : Bouton masqué pour commandes annulées
2. **Backend** : API refuse les requêtes pour commandes annulées

### Messages d'Erreur

- **Arabe** : لا يمكن إنشاء فاتورة للطلبات الملغاة
- **Français** : Aucune facture disponible pour les commandes annulées
- **Technique** : Cannot generate invoice for cancelled orders

### Logs et Audit

```javascript
console.log(`PDF generation blocked for cancelled order: ${orderId}`);
```

## 🧪 Tests de Validation

### Test Automatique

```bash
node test-cancelled-order-pdf.js
```

### Test Manuel

1. Créer une commande
2. L'annuler
3. Vérifier que le bouton PDF disparaît
4. Vérifier le message explicatif
5. Tenter un accès direct API (doit échouer)

## 📊 Statistiques et Reporting

### Métriques à Suivre

- Nombre de tentatives PDF sur commandes annulées
- Taux d'annulation par période
- Impact sur la génération de factures

### Alertes

- Tentative de génération PDF sur commande annulée
- Pic d'annulations inhabituel
- Erreurs de validation

## 🔄 Évolutions Futures

### Possibles Améliorations

1. **Avoir de crédit** : Pour annulations après facturation
2. **Facture d'annulation** : Document officiel d'annulation
3. **Historique** : Traçabilité des tentatives de génération
4. **Notifications** : Alertes automatiques

### Cas Spéciaux à Considérer

- Annulation partielle (si implémentée)
- Remboursements
- Échanges de produits
- Commandes en plusieurs fois

---

## 🎯 Résumé Exécutif

**Règle d'Or** : Pas de facture sans transaction réelle.

**Implémentation** : Validation double (UI + API) pour empêcher la génération de
factures sur commandes annulées.

**Conformité** : Respecte les normes comptables tunisiennes et françaises.

**Sécurité** : Contrôles multiples et messages d'erreur appropriés.
