#!/bin/bash

# Script de déploiement Vercel pour HoneyStore365
# Usage: ./scripts/deploy-vercel.sh [environment]

# Configuration
ENVIRONMENT=${1:-"production"}
PROJECT_NAME="honeystore365"
DEPLOYMENT_ENV=""

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI n'est pas installé. Installation en cours..."
    npm install -g vercel
fi

# Vérifier si l'utilisateur est connecté
if ! vercel whoami &> /dev/null; then
    log_warn "Veuillez vous connecter à Vercel CLI"
    vercel login
fi

# Déterminer l'environnement de déploiement
case $ENVIRONMENT in
    "staging")
        DEPLOYMENT_ENV="--prebuilt"
        log_info "Déploiement en environnement de staging"
        ;;
    "production")
        DEPLOYMENT_ENV="--prod"
        log_info "Déploiement en environnement de production"
        ;;
    *)
        log_error "Environnement invalide. Utilisez 'staging' ou 'production'"
        exit 1
        ;;
esac

# Vérifier si le projet est construisible
log_info "Vérification de la construction du projet..."
if npm run build; then
    log_info "Construction réussie"
else
    log_error "Échec de la construction"
    exit 1
fi

# Déployer sur Vercel
log_info "Déploiement en cours sur Vercel..."
if vercel $DEPLOYMENT_ENV; then
    log_info "Déploiement réussi!"
    
    # Afficher l'URL du déploiement
    DEPLOYMENT_URL=$(vercel ls | grep -o 'https://[a-zA-Z0-9.-]*\.vercel\.app')
    if [ -n "$DEPLOYMENT_URL" ]; then
        log_info "URL du déploiement: $DEPLOYMENT_URL"
    fi
    
    # Optionnel: Envoyer une notification
    if command -v curl &> /dev/null; then
        log_info "Envoi d'une notification de déploiement..."
        # Vous pouvez personnaliser cette partie pour envoyer des notifications
        # Par exemple via Slack, Discord, ou un webhook
    fi
else
    log_error "Échec du déploiement"
    exit 1
fi

# Nettoyage optionnel
log_info "Nettoyage des fichiers temporaires..."
rm -rf .next
rm -rf out

log_info "Processus de déploiement terminé"
