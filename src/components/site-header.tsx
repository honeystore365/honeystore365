"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient'; // Assurez-vous que c'est bien createBrowserClient
import { useRouter } from 'next/navigation'; // usePathname retiré car non utilisé après modifs
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js'; // Import du type Session

// --- Constants ---
const LOGO_URL = "/favicon.png";
const LOGO_ALT = "مناحل الرحيق Logo";
const COMPANY_NAME = "مناحل الرحيق";

const navLinkBaseClasses = "text-base md:text-lg font-medium text-gray-700 hover:text-honey transition-colors duration-300 relative";

// Simplification : retrait de extraSpacingClass, l'espacement sera géré par le parent <nav>
const navigationLinks = [
  { href: "/products", label: "المنتجات" },
  { href: "/cart", label: "السلة", showBadge: true },
  { href: "/profile", label: "حسابي" }, // Lien vers le profil utilisateur
];

const authLinks = [
 { href: "/auth/login", label: "تسجيل الدخول", variant: "outline" as const, extraClasses: "border-honey text-honey hover:bg-honey/10 px-4 py-2 text-sm md:text-base" }, // Ajustement taille/padding
 { href: "/auth/register", label: "انشاء حساب", variant: "default" as const, extraClasses: "bg-honey hover:bg-honey-dark px-4 py-2 text-sm md:text-base" }, // Ajustement taille/padding
];

// --- Component ---

export function SiteHeader() {
  // Utilisation du type Session | null pour plus de sécurité
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Ajout d'un état de chargement
  const router = useRouter();

  // TODO: Obtenir le nombre d'articles dans le panier (logique à implémenter)
  const cartItemCount = 0; // Placeholder

  useEffect(() => {
    // 1. Obtenir la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Fin du chargement initial
    });

    // 2. Écouter les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth state changed:", _event, session); // Pour le débogage
        setSession(session);
        // Si on vient de se déconnecter et qu'on est sur une page protégée (ex: /profile), rediriger
        if (_event === 'SIGNED_OUT' && navigationLinks.some(link => window.location.pathname.startsWith(link.href) && link.href !== '/products' && link.href !== '/cart')) {
            router.push('/'); // Redirige vers l'accueil après déconnexion si nécessaire
        }
         // Recharger la page après connexion/déconnexion pour assurer la cohérence
         // C'est une solution simple, mais une gestion d'état plus fine (Zustand, Context) serait mieux pour de grosses applis.
        if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
           // router.refresh(); // Peut aider à rafraîchir les données Server Components si nécessaire
        }
      }
    );

    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]); // Ajouter router aux dépendances si utilisé dans l'effet

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // La redirection est maintenant gérée par onAuthStateChange ou peut être faite explicitement ici si préféré :
    router.push('/'); // Rediriger vers l'accueil après déconnexion
  };

  // Ne pas afficher le header tant que la session n'est pas chargée pour éviter le flash
  // Ou afficher une version de chargement simplifiée
  // if (loading) {
  //   return <header className="sticky top-0 z-50 w-full h-16 md:h-20 bg-white border-b border-honey/20 flex items-center justify-center"><p>Loading...</p></header>; // Placeholder de chargement
  // }

  return (
    // sticky top-0 z-50 w-full -> assure que le header reste en haut et prend toute la largeur
    <header className="sticky top-0 z-50 w-full border-b border-honey/20 bg-white/80 shadow-sm backdrop-blur-md">
      {/* Suppression de 'container mx-auto'. Ajout de padding directement ici */}
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 md:h-20">

        {/* Logo Section - Gardé à gauche */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2 md:gap-3"> {/* flex-shrink-0 pour éviter qu'il ne rétrécisse */}
          <Image
            src={LOGO_URL}
            alt={LOGO_ALT}
            width={40} // Légèrement réduit pour les petits écrans
            height={40}
            priority
            className="h-8 w-8 md:h-10 md:w-10" // Tailles responsives
          />
          <span className="hidden text-lg font-bold text-honey-dark sm:inline md:text-xl lg:text-2xl">
            {COMPANY_NAME}
          </span>
        </Link>

        {/* Desktop Navigation - Centered and takes available space */}
        {/* Ajout de flex-grow pour occuper l'espace, justify-center pour centrer les liens */}
        <nav className="hidden flex-grow items-center justify-center space-x-4 md:flex md:space-x-6 lg:space-x-8">
          {navigationLinks.map((link) => (
             // Ne pas afficher "Mon Compte" si l'utilisateur n'est pas connecté
             (link.href === "/profile" && !session) ? null : (
                <Link
                key={link.href}
                href={link.href}
                className={cn(navLinkBaseClasses)}
                >
                {link.label}
                {link.href === "/cart" && link.showBadge && ( // Afficher le badge uniquement pour le panier
                    <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-honey text-xs font-bold text-white">
                    {cartItemCount}
                    </span>
                )}
                </Link>
             )
          ))}
        </nav>

        {/* Auth Buttons Section or Sign Out - Gardé à droite */}
        {/* Ajout de flex-shrink-0 pour éviter qu'il ne rétrécisse */}
        <div className="hidden flex-shrink-0 items-center space-x-2 md:flex md:space-x-4">
          {session ? (
            // Afficher uniquement le bouton Sign Out si connecté
            <Button
              spacing="lg" // Vérifiez si cette prop existe sur votre composant Button
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500/10 px-4 py-2 text-sm md:text-base" // Ajustement taille/padding
              onClick={handleSignOut}
            >
              تسجيل الخروج {/* Traduction de Sign Out */}
            </Button>
          ) : (
            // Afficher les boutons Login/Register si non connecté
            authLinks.map((link) => (
              <Button
                spacing="lg" // Vérifiez si cette prop existe
                key={link.href}
                variant={link.variant}
                className={link.extraClasses} // Les classes contiennent déjà le padding/taille
                asChild
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))
          )}
        </div>

        {/* Mobile Menu Trigger - Gardé à droite */}
        {/* Assurez-vous que ce trigger est bien le dernier élément visuel pour l'ordre sur mobile */}
        <div className="flex items-center md:hidden"> {/* Utiliser flex pour aligner si besoin */}
          <SidebarTrigger />
        </div>
      </div>
    </header>
  );
}