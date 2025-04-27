import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils" // Assurez-vous que ce chemin est correct

const buttonVariants = cva(
  // Styles de base
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "shadow-sm bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "shadow-sm bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "shadow-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "shadow-sm bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "shadow-sm hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      // --- NOUVELLE VARIANTE ---
      spacing: {
        none: "", // Aucune marge ajoutée
        sm: "m-1", // Petite marge (Tailwind: margin 0.25rem)
        md: "m-2", // Marge moyenne (Tailwind: margin 0.5rem)
        lg: "m-4", // Grande marge (Tailwind: margin 1rem)
        // Ajoutez d'autres tailles ou des marges spécifiques (mt-2, mx-4, etc.) si nécessaire
      },
      // --- FIN NOUVELLE VARIANTE ---
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      spacing: "none", // Par défaut, pas de marge ajoutée
    },
  }
)

// L'interface ButtonProps est automatiquement mise à jour grâce à VariantProps
// pour inclure la nouvelle prop `spacing?`.
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, spacing, asChild = false, ...props }, ref) => { // Ajouter `spacing` ici
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        // Ajouter `spacing` à l'appel de buttonVariants
        className={cn(buttonVariants({ variant, size, spacing, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }