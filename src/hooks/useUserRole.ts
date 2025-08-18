'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createUserContext, getUserCapabilities, UserContext } from '@/lib/auth/user-role-utils';

export function useUserRole() {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Fonction pour mettre à jour le contexte utilisateur
    const updateUserContext = (user: any) => {
      if (user) {
        const context = createUserContext(user);
        setUserContext(context);
      } else {
        setUserContext(createUserContext(null)); // Utilisateur invité
      }
      setLoading(false);
    };

    // Obtenir la session actuelle
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        updateUserContext(session?.user || null);
      } catch (error) {
        console.error('Error getting session:', error);
        updateUserContext(null);
      }
    };

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        updateUserContext(session?.user || null);
      }
    );

    getSession();

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Obtenir les capacités utilisateur
  const capabilities = userContext ? getUserCapabilities({ email: userContext.email }) : null;

  return {
    userContext,
    capabilities,
    loading,
    
    // Raccourcis pour les vérifications courantes
    isAdmin: userContext?.isAdmin || false,
    isCustomer: userContext?.isCustomer || false,
    isGuest: userContext?.isGuest || false,
    canUseCart: userContext?.canUseCart || false,
    canAccessAdmin: userContext?.canAccessAdmin || false,
  };
}