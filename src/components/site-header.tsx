"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { createClientComponent } from '@/lib/supabase/client'; // Keep for signOut
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react'; // Keep useState, add useEffect back just in case, though likely not needed for session
import type { Session } from '@supabase/supabase-js'; // Re-add Session type import
import { ShoppingCart, User } from 'lucide-react';
import { useSession } from '@/context/SessionProvider'; // Import useSession hook
import { useUserRole } from '@/hooks/useUserRole';
import { ConditionalCartBadge } from '@/components/ui/conditional-cart-badge';

// --- Constants ---
const LOGO_URL = "/favicon.png";
const LOGO_ALT = "مناحل الرحيق Logo";
const COMPANY_NAME = "مناحل الرحيق";

const navLinkBaseClasses = "relative flex items-center gap-1.5 text-base font-medium text-gray-700 transition-colors duration-300 hover:text-honey";

// Navigation links with icons for better visual hierarchy
const getNavigationLinks = (isAdmin: boolean, canUseCart: boolean) => [
  ...(isAdmin ? [] : [{ href: "/products", label: "المنتجات", icon: null }]),
  ...(canUseCart ? [{ href: "/cart", label: "السلة", icon: <ShoppingCart className="h-4 w-4" />, showBadge: true }] : []),
  { href: isAdmin ? "/admin" : "/profile", label: isAdmin ? "لوحة التحكم" : "حسابي", icon: <User className="h-4 w-4" /> },
];

const authLinks = [
  {
    href: "/auth/login",
    label: "تسجيل الدخول",
    variant: "outline" as const,
    extraClasses: "border-honey text-honey hover:bg-honey/10"
  },
  {
    href: "/auth/register",
    label: "انشاء حساب",
    variant: "default" as const,
    extraClasses: "bg-honey hover:bg-honey-dark"
  },
];

// --- Component ---
export function SiteHeader() {
  // Get session state from context
  const { session, loading } = useSession(); // Use context hook
  const { canUseCart, isAdmin } = useUserRole(); // Get user role info
  const [cartItemCount, setCartItemCount] = useState(0); // Keep cart state if needed
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Note: No useEffect needed here for session management anymore

  const handleSignOut = async () => {
    const supabase = createClientComponent();
    await supabase.auth.signOut();
    router.push('/'); // Redirect to home after sign out
  };

  // Custom mobile menu trigger that also controls the state
  const CustomMobileMenuTrigger = () => (
    <div
      className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10"
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      role="button"
      tabIndex={0}
    >
      <SidebarTrigger />
    </div>
  );

  // Show loading state while session is being determined initially by context
  if (loading) {
    // Return a minimal header skeleton or null to avoid flash of incorrect buttons
    // This ensures that auth buttons don't briefly show the wrong state.
    return (
      <header className="sticky top-0 z-50 w-full h-16 border-b border-honey/20 bg-white/95">
        <div className="flex h-16 items-center justify-between w-full max-w-none px-4 sm:px-6 lg:px-8">
          {/* Placeholder for Logo */}
          <div className="flex flex-shrink-0 items-center">
            <Link href="/" className="flex items-center gap-2 md:gap-3">
              <Image
                src={LOGO_URL}
                alt={LOGO_ALT}
                width={40}
                height={40}
                priority
                className="h-8 w-8 md:h-10 md:w-10 rounded-md object-contain"
              />
               <span className="hidden text-lg font-bold text-honey-dark sm:inline md:text-xl">
                {COMPANY_NAME}
              </span>
            </Link>
          </div>
          {/* Placeholder for nav/auth buttons area */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse md:flex hidden"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full max-w-none border-b border-honey/20 bg-white/95 shadow-sm backdrop-blur-md transition-all duration-200">
      <div className="flex h-16 items-center justify-between w-full max-w-none px-4 sm:px-6 lg:px-8">
        {/* Logo Section - Always visible */}
        <div className="flex flex-shrink-0 items-center">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <Image
              src={LOGO_URL}
              alt={LOGO_ALT}
              width={40}
              height={40}
              priority
              className="h-8 w-8 md:h-10 md:w-10 rounded-md object-contain"
            />
            <span className="hidden text-lg font-bold text-honey-dark sm:inline md:text-xl">
              {COMPANY_NAME}
            </span>
          </Link>
        </div>

        {/* Desktop Navigation - Center aligned */}
        <nav className="hidden flex-grow items-center justify-center space-x-1 md:flex md:space-x-6 lg:space-x-12">
          {getNavigationLinks(isAdmin, canUseCart).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                navLinkBaseClasses,
                "px-3 py-2 rounded-md hover:bg-gray-50 relative"
              )}
            >
              {link.icon && <span className="text-honey">{link.icon}</span>}
              <span>{link.label}</span>
              {link.href === "/cart" && link.showBadge && (
                <ConditionalCartBadge />
              )}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons Section - Right aligned */}
        <div className="hidden flex-shrink-0 items-center gap-3 md:flex">
          {session ? (
            // Show sign out button if logged in
            <Button
              variant="outline"
              size="sm"
              className="border-red-500 text-red-500 hover:bg-red-500/10"
              onClick={handleSignOut}
            >
              تسجيل الخروج
            </Button>
          ) : (
            // Show login/register buttons if not logged in
            authLinks.map((link) => (
              <Button
                key={link.href}
                variant={link.variant}
                size="sm"
                className={link.extraClasses}
                asChild
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center md:hidden">
          {/* Cart icon with badge for quick access on mobile - only for customers */}
          {canUseCart && (
            <Link
              href="/cart"
              className="mr-2 flex items-center justify-center rounded-full p-2 text-gray-700 hover:bg-gray-100 relative"
            >
              <ShoppingCart className="h-5 w-5 text-honey" />
              <ConditionalCartBadge />
            </Link>
          )}

          {/* Mobile menu trigger */}
          <CustomMobileMenuTrigger />
        </div>
      </div>

      {/* Mobile Menu Dropdown - Conditionally rendered */}
      {mobileMenuOpen && (
        <div className="animate-in fade-in slide-in-from-top-5 md:hidden">
          <div className="border-t border-gray-200 bg-white px-4 py-3 shadow-lg">
            <nav className="flex flex-col space-y-3">
              {getNavigationLinks(isAdmin, canUseCart).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    navLinkBaseClasses,
                    "flex w-full justify-between rounded-md px-3 py-2.5 hover:bg-gray-50 relative"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    {link.icon && <span className="text-honey">{link.icon}</span>}
                    <span>{link.label}</span>
                    {link.href === "/cart" && link.showBadge && (
                      <ConditionalCartBadge />
                    )}
                  </div>
                </Link>
              ))}
            </nav>

            {/* Auth buttons in mobile menu */}
            <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-gray-100">
              {session ? (
                <Button
                  variant="outline"
                  className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  تسجيل الخروج
                </Button>
              ) : (
                authLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant={link.variant}
                    className={cn("w-full", link.extraClasses)}
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Remove the example usage export if SiteHeader is the main export needed
// export default function HeaderExample() { ... }
