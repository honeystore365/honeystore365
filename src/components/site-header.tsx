import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils'; // Assurez-vous que cn est importé

// --- Constants ---
const LOGO_URL = "https://via.placeholder.com/60x60.png?text=Logo"; // TODO: Remplacer par le vrai logo
const LOGO_ALT = "مناحل الرحيق Logo";
const COMPANY_NAME = "مناحل الرحيق";

const navLinkBaseClasses = "text-lg font-medium text-gray-700 hover:text-honey transition-colors duration-300 relative"; // 'relative' déplacé ici

// Mise à jour : Ajout de 'extraSpacingClass'
const navigationLinks = [
  { href: "/products", label: "المنتجات" , extraSpacingClass: "mx-8" }, // Pas d'espacement supplémentaire spécifique ici
  {
    href: "/cart",
    label: "السلة",
    showBadge: true,
    extraSpacingClass: "mx-8" // <- AJOUT: Ajoute une marge horizontale (gauche et droite)
                                 //    Vous pouvez utiliser 'mr-4', 'ml-4', 'mx-6', etc. selon le besoin.
  },
  { href: "/profile", label: "حسابي" },
];

// TODO: Gérer l'état d'authentification
const authLinks = [
    { href: "/auth/login", label: "تسجيل الدخول", variant: "outline" as const, extraClasses: "border-honey text-honey hover:bg-honey/10" },
    { href: "/auth/register", label: "انشاء حساب", variant: "default" as const, extraClasses: "bg-honey hover:bg-honey-dark" },
];

// --- Component ---

export function SiteHeader() {
  // TODO: Obtenir le nombre d'articles dans le panier
  const cartItemCount = 0; // Placeholder

  return (
    <header className="sticky top-0 z-50 w-full border-b border-honey/20 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20">

        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={LOGO_URL}
            alt={LOGO_ALT}
            width={50}
            height={50}
            priority
          />
          <span className="hidden text-xl font-bold text-honey-dark sm:inline md:text-2xl">
            {COMPANY_NAME}
          </span>
        </Link>

        {/* Desktop Navigation */}
        {/* Ajustez space-x si nécessaire en conjonction avec les marges spécifiques */}
        <nav className="hidden items-center space-x-6 md:flex lg:space-x-8">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              // Mise à jour : Utilisation de cn pour combiner les classes
              className={cn(
                navLinkBaseClasses, // Classes de base
                link.extraSpacingClass // Classe d'espacement supplémentaire (sera undefined si non fournie)
              )}
            >
              {link.label}
              {link.showBadge && (
                <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-honey text-xs font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons Section */}
        <div className="hidden items-center space-x-4 md:flex">
           {authLinks.map((link) => (
             <Button spacing="lg" key={link.href} variant={link.variant} className={link.extraClasses} asChild>
               <Link href={link.href}>{link.label}</Link>
             </Button>
           ))}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
      </div>
    </header>
  );
}