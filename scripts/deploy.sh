#!/bin/bash

# Script de déploiement pour HoneyStore
echo "🍯 Déploiement de HoneyStore sur Vercel"

# Vérification des prérequis
echo "📋 Vérification des prérequis..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

# Vérifier la version de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ requis (version actuelle: $(node -v))"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm ci

# Vérification du linting
echo "🔍 Vérification du code..."
npm run lint

# Build de test
echo "🏗️ Test de build..."
npm run build

# Vérification des variables d'environnement
echo "🔐 Vérification des variables d'environnement..."
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo "⚠️ Aucun fichier .env trouvé"
    echo "📝 Créez un fichier .env.local avec les variables requises"
    echo "   Consultez .env.example pour la liste complète"
fi

# Nettoyage
echo "🧹 Nettoyage..."
rm -rf .next
rm -rf out

echo "✅ Prêt pour le déploiement!"
echo ""
echo "🚀 Pour déployer sur Vercel:"
echo "   1. Connectez votre repo à Vercel"
echo "   2. Ajoutez les variables d'environnement"
echo "   3. Déployez avec: git push origin main"
echo ""
echo "📚 Consultez DEPLOYMENT.md pour plus de détails"