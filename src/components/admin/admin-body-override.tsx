'use client';

import { useEffect } from 'react';

export function AdminBodyOverride() {
  useEffect(() => {
    // Override des styles du body pour l'admin
    const body = document.body;
    const originalClasses = body.className;

    // Appliquer les styles admin
    body.className = 'min-h-screen bg-gray-50 text-gray-900 antialiased';
    body.style.backgroundColor = '#f9fafb';
    body.style.color = '#111827';

    // Nettoyer au démontage
    return () => {
      body.className = originalClasses;
      body.style.backgroundColor = '';
      body.style.color = '';
    };
  }, []);

  return null;
}
