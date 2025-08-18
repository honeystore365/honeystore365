# Résolution des Erreurs d'Authentification

## Erreur "Invalid Refresh Token: Refresh Token Not Found"

Cette erreur se produit lorsque les tokens d'authentification Supabase sont
corrompus ou expirés.

### Solutions Rapides

#### 1. Bouton de Réparation Automatique

Si vous voyez une bannière d'erreur rouge en haut de la page, cliquez sur le
bouton **"Fix Auth Error"**.

#### 2. Console du Navigateur

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet Console
3. Tapez : `manualAuthCleanup()`
4. Appuyez sur Entrée
5. La page se rechargera automatiquement

#### 3. Nettoyage Manuel

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet Application/Storage
3. Supprimez tous les éléments qui commencent par `sb-` dans :
   - Local Storage
   - Session Storage
   - Cookies
4. Rechargez la page

#### 4. Navigation Privée

Testez l'application dans une fenêtre de navigation privée pour confirmer que le
problème est résolu.

### Prévention

- Évitez de fermer l'onglet pendant les opérations d'authentification
- Ne modifiez pas manuellement les cookies d'authentification
- Déconnectez-vous proprement avant de fermer l'application

### Si le Problème Persiste

1. Videz complètement le cache du navigateur
2. Redémarrez le serveur de développement : `npm run dev`
3. Vérifiez la configuration Supabase dans `.env.local`

## Autres Erreurs d'Authentification

### "JWT expired"

- Même solution que ci-dessus
- Le token a expiré et doit être rafraîchi

### "Session not found"

- Reconnectez-vous à l'application
- Vérifiez que les variables d'environnement Supabase sont correctes

### "Invalid credentials"

- Vérifiez l'email et le mot de passe
- Assurez-vous que le compte existe dans Supabase
