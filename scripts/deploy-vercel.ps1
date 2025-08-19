# Script de déploiement Vercel pour HoneyStore365
# Usage: .\scripts\deploy-vercel.ps1 [-Environment <string>]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "production"
)

# Configuration
$PROJECT_NAME = "honeystore365"
$DEPLOYMENT_ENV = ""

# Fonctions pour afficher les messages
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Déterminer l'environnement de déploiement
switch ($Environment) {
    "staging" {
        $DEPLOYMENT_ENV = "--prebuilt"
        Write-Info "Déploiement en environnement de staging"
    }
    "production" {
        $DEPLOYMENT_ENV = "--prod"
        Write-Info "Déploiement en environnement de production"
    }
}

# Vérifier si Vercel CLI est installé
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Error "Vercel CLI n'est pas installé. Installation en cours..."
    npm install -g vercel
}

# Vérifier si l'utilisateur est connecté
try {
    $vercelUser = vercel whoami
    if (-not $vercelUser) {
        Write-Warn "Veuillez vous connecter à Vercel CLI"
        vercel login
    }
}
catch {
    Write-Warn "Veuillez vous connecter à Vercel CLI"
    vercel login
}

# Vérifier si le projet est construisible
Write-Info "Vérification de la construction du projet..."
if (npm run build) {
    Write-Info "Construction réussie"
} else {
    Write-Error "Échec de la construction"
    exit 1
}

# Déployer sur Vercel
Write-Info "Déploiement en cours sur Vercel..."
try {
    $deployResult = vercel $DEPLOYMENT_ENV
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Déploiement réussi!"
        
        # Afficher l'URL du déploiement
        $deploymentUrl = vercel ls | Select-String -Pattern 'https://[a-zA-Z0-9.-]*\.vercel\.app'
        if ($deploymentUrl) {
            Write-Info "URL du déploiement: $($deploymentUrl.Line)"
        }
        
        # Optionnel: Envoyer une notification
        if (Get-Command curl -ErrorAction SilentlyContinue) {
            Write-Info "Envoi d'une notification de déploiement..."
            # Vous pouvez personnaliser cette partie pour envoyer des notifications
            # Par exemple via Slack, Discord, ou un webhook
        }
    } else {
        Write-Error "Échec du déploiement"
        exit 1
    }
}
catch {
    Write-Error "Échec du déploiement: $_"
    exit 1
}

# Nettoyage optionnel
Write-Info "Nettoyage des fichiers temporaires..."
Remove-Item -Path ".next", "out" -Recurse -Force -ErrorAction SilentlyContinue

Write-Info "Processus de déploiement terminé"
