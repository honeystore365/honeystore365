'use client';

import { ShoppingCart, User, Info } from 'lucide-react';

export function AdminCartInfo() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <Info className="h-8 w-8 text-blue-600" />
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-blue-900">
            Mode Administrateur
          </h3>
        </div>
      </div>
      
      <div className="space-y-3 text-blue-800">
        <div className="flex items-start">
          <User className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm">
            Vous êtes connecté en tant qu'<strong>administrateur</strong> du système.
          </p>
        </div>
        
        <div className="flex items-start">
          <ShoppingCart className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm">
            Les fonctionnalités de <strong>panier</strong> et d'<strong>achat</strong> sont désactivées pour les comptes administrateurs.
          </p>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-md">
          <p className="text-xs text-blue-700">
            <strong>Pourquoi ?</strong> Les administrateurs gèrent le système mais ne sont pas des clients. 
            Cette séparation garantit la sécurité et la clarté des rôles.
          </p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-sm text-blue-700">
          Pour effectuer des achats, utilisez un compte client séparé.
        </p>
      </div>
    </div>
  );
}