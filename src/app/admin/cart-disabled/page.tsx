import Link from 'next/link';
import { AdminCartInfo } from '@/components/admin/admin-cart-info';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, BarChart3 } from 'lucide-react';

export default function AdminCartDisabledPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panier Non Disponible
          </h1>
          <p className="text-gray-600">
            Cette fonctionnalité n'est pas accessible en mode administrateur
          </p>
        </div>

        {/* Composant d'information */}
        <div className="mb-8">
          <AdminCartInfo />
        </div>

        {/* Actions recommandées */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Actions Recommandées
          </h2>
          
          <div className="space-y-4">
            <Link href="/admin">
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Retourner au Dashboard Admin
              </Button>
            </Link>
            
            <Link href="/admin/products">
              <Button className="w-full justify-start" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Gérer les Produits
              </Button>
            </Link>
            
            <Link href="/admin/orders">
              <Button className="w-full justify-start" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Gérer les Commandes
              </Button>
            </Link>
          </div>
        </div>

        {/* Note sur la séparation des rôles */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Séparation des Rôles
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Cette séparation entre les comptes administrateurs et clients est une 
                  mesure de sécurité importante qui :
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Évite les conflits d'intérêts</li>
                  <li>Maintient la clarté des responsabilités</li>
                  <li>Renforce la sécurité du système</li>
                  <li>Facilite l'audit et la traçabilité</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Retour */}
        <div className="mt-8 text-center">
          <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-500">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}