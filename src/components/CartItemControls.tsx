'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { removeCartItem, updateCartItemQuantity } from '@/actions/cartActions';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartProvider';
import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react';

interface CartItemControlsProps {
  cartItemId: string;
  initialQuantity: number;
  isUnavailable?: boolean;
  onQuantityChange?: (cartItemId: string, newQuantity: number) => void; // Callback for successful update
  onRemove?: (cartItemId: string) => void; // Callback for successful removal
}

export default function CartItemControls({ 
  cartItemId, 
  initialQuantity, 
  isUnavailable = false,
  onQuantityChange,
  onRemove
}: CartItemControlsProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { refreshCart } = useCart();

  // Update quantity optimistically and call server action
  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 && !isUnavailable) {
      handleRemoveItem(); // Trigger removal if quantity goes below 1
      return;
    }
    if (isUnavailable && newQuantity < 0) return;

    const oldQuantity = quantity; // Store old quantity for potential revert
    setQuantity(newQuantity); // Optimistic UI update
    setIsUpdating(true);

    try {
      const result = await updateCartItemQuantity(cartItemId, newQuantity);
      if (result.success) {
        toast({ title: "Success", description: "Cart updated." });
        onQuantityChange?.(cartItemId, newQuantity); // Notify parent on success
        // Refresh the cart context to update the badge
        await refreshCart();
      } else {
        toast({ title: "Error", description: result.message || "Failed to update quantity.", variant: "destructive" });
        setQuantity(oldQuantity); // Revert optimistic update on failure
      }
    } catch (error) {
        toast({ title: "Error", description: "Failed to update quantity.", variant: "destructive" });
        setQuantity(oldQuantity); // Revert optimistic update on error
    } finally {
        setIsUpdating(false);
    }
  };

  // Handle removal optimistically
  const handleRemoveItem = async () => {
    setIsUpdating(true); // Disable buttons during removal attempt
    try {
      const result = await removeCartItem(cartItemId); // Server action still revalidates
      if (result.success) {
        toast({ title: "Success", description: "Item removed from cart." });
        onRemove?.(cartItemId); // Notify parent
        // Refresh the cart context to update the badge
        await refreshCart();
        // No need to set local state as parent will remove the item
      } else {
        toast({ title: "Error", description: result.message || "Failed to remove item.", variant: "destructive" });
        setIsUpdating(false); // Re-enable buttons if removal failed
      }
    } catch (error) {
        toast({ title: "Error", description: "Failed to remove item.", variant: "destructive" });
        setIsUpdating(false); // Re-enable buttons on error
    }
    // Don't set isUpdating to false on success, as component might unmount
  };

  const increment = () => handleUpdateQuantity(quantity + 1);
  const decrement = () => handleUpdateQuantity(quantity - 1);

  if (isUnavailable) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={handleRemoveItem}
        disabled={isUpdating}
        aria-label="Remove unavailable item"
      >
        <Trash2Icon className="h-4 w-4 mr-1" /> إزالة
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={decrement} 
        disabled={isUpdating || quantity <= 1}
        aria-label="Decrease quantity"
        className="h-8 w-8"
      >
        <MinusIcon className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        value={quantity}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val) && val > 0) {
            // Debounce or update on blur could be better for direct input
            // For now, let +/- buttons handle updates primarily
            setQuantity(val); 
          } else if (e.target.value === '') {
            setQuantity(0); // Allow typing to empty, but blur/action will validate
          }
        }}
        onBlur={(e) => { // Update on blur if value changed
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val) && val > 0 && val !== initialQuantity) {
            handleUpdateQuantity(val);
          } else if (val <= 0 || isNaN(val)) { // Reset to initial or handle removal if 0
             setQuantity(initialQuantity); // Revert if invalid
             if (val === 0) handleRemoveItem();
          }
        }}
        className="w-14 h-8 text-center"
        disabled={isUpdating}
        aria-label="Item quantity"
      />
      <Button 
        variant="outline" 
        size="icon" 
        onClick={increment} 
        disabled={isUpdating}
        aria-label="Increase quantity"
        className="h-8 w-8"
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRemoveItem}
        disabled={isUpdating}
        className="text-destructive hover:bg-destructive/10 h-8 w-8"
        aria-label="Remove item"
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </div>
  );
}
