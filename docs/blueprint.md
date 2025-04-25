# **App Name**: منحلة الرحيق

## Core Features:

- Product Catalog: Display a catalog of honey and related products with details like name, description, price, and images.
- Shopping Cart: Enable users to add products to a cart and view/modify the cart contents.
- AI Chatbot Assistant: Integrate an AI assistant tool to help customers with product search and order assistance.

## Style Guidelines:

- Primary colors: Honey yellow, light gray, and off-white.
- Accent: Gold (#FFD700) for highlights and interactive elements.
- Warm, natural Arabic typography with an artisanal touch for menus, layout, site name and product names
- Subtle honeycomb pattern in SVG as the global layout background.
- Smooth, natural transitions and scroll animations (fade in, slight parallax).
- Visual details inspired by bees (e.g., zigzag flight for hovers).

## Original User Request:
Boutique en ligne de vente de miel avec Next.js 14 et Supabase
Je veux créer une boutique en ligne moderne et performante pour vendre du miel et ses dérivés (pollen, propolis, gelée royale, bougies, etc.).
Le site doit être développé en Next.js 14 avec l'App Router, TypeScript et Tailwind CSS pour le style.
La base de données et l'authentification seront gérées par Supabase.


Design / UI
Couleurs dominantes : Jaune miel, gris clair et touches de blanc cassé.

Background : un motif subtil de nids d’abeilles en SVG sur le layout global.

Typographie : chaleureuse, naturelle, avec une touche artisanale.

Animations :

Transitions douces et naturelles.

Animations au scroll (fade in, parallax léger).

Détails visuels inspirés des abeilles (ex : vol en zigzag pour les hover).


Structure du site
Homepage : Mise en avant des produits phares, bannière de bienvenue, CTA.

/products : Liste de produits avec filtres (type, prix).

/products/[id] : Page produit détaillée avec images, description, et bouton “Ajouter au panier”.

/cart : Panier interactif avec quantité modifiable.

/checkout : Récapitulatif + infos de livraison + validation commande.

/auth : Login / Register avec Supabase Auth (email + réseaux sociaux).

/profile : Historique des commandes, gestion du profil utilisateur.

/chatbot : Intégration d’un assistant IA pour aider les clients (recherche produit, aide commande, etc).


Fonctionnalités techniques
Next.js 14 (App Router) avec Server Components pour le contenu produit.

Supabase DB pour stocker :

Produits (nom, description, prix, images, catégorie…)

Utilisateurs

Commandes

Avis clients

Supabase Auth avec providers OAuth (Google, GitHub, etc.).

API Routes ou Route Handlers pour gérer le panier, les commandes, etc.

ESLint + TypeScript activés dès le départ.

Turbopack pour un dev rapide.


Responsive
Design responsive pour tous types d’écrans (mobile-first, desktop-friendly).


Bonus
Intégration de metadata SEO avec generateMetadata de Next.js.

Liens vers réseaux sociaux dans le header/footer.

Icones personnalisées (favicon, apple-icon) avec design abeille.
  