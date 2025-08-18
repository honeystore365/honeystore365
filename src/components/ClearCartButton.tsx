'use client';

import { Button } from '@/components/ui/button';
import { clearCart } from '@/actions/cartActions';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartProvider';
import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';

interface ClearCartButtonProps {
  className?: string;
  onCartCleared?: () => void; // Callback prop
}

export default function ClearCartButton({ className, onCartCleared }: ClearCartButtonProps) {
  const { toast } = useToast();
  const { refreshCart } = useCart();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCart = async () => {
    setIsClearing(true);
    try {
      const result = await clearCart();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Cart has been cleared.',
        });
        onCartCleared?.(); // Call the callback on success
        // Refresh the cart context to update the badge
        await refreshCart();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Could not clear cart.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while clearing the cart.',
        variant: 'destructive',
      });
    }
    setIsClearing(false);
  };

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleClearCart}
      disabled={isClearing}
      className={className}
    >
      <Trash2Icon className="h-5 w-5 mr-2" />
      {isClearing ? 'Clearing...' : 'Clear Entire Cart'}
    </Button>
  );
}
