#!/usr/bin/env node
/**
 * Script de déploiement Vercel automatique
 * Usage: node vercel-deploy.js --token=TON_TOKEN
 */

const { execSync } = require('child_process');
const fs = require('fs');

const token = process.argv.find(arg => arg.startsWith('--token='))?.split('=')[1];

if (!token) {
  console.log(`
❌ Token Vercel manquant

Pour obtenir ton token:
1. Va sur https://vercel.com/account/tokens
2. Crée un nouveau token
3. Relance: node vercel-deploy.js --token=TON_TOKEN

Ou déploie manuellement:
npx vercel --prod
`);
  process.exit(1);
}

console.log('🚀 Déploiement en cours...\n');

try {
  // Set environment variables
  console.log('📦 Configuration des variables...');
  
  execSync(`npx vercel env add NEXT_PUBLIC_INSTANT_APP_ID production --token=${token} <<< "68720b42-a379-4ba1-939e-f73b2c877b77"`, { stdio: 'inherit' });
  execSync(`npx vercel env add INSTANT_ADMIN_TOKEN production --token=${token} <<< "0d0b1fe1-a270-4779-ba17-4e30eb476b54"`, { stdio: 'inherit' });
  
  // Deploy
  console.log('\n🚀 Déploiement...');
  execSync(`npx vercel --prod --token=${token} --yes`, { stdio: 'inherit' });
  
  console.log('\n✅ Déploiement terminé!');
  
} catch (error) {
  console.error('\n❌ Erreur:', error.message);
  process.exit(1);
}
