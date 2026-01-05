'use client';

import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CartItem } from '@/types/a-la-carte';
import { formatPrice } from '@/lib/utils/format';

type AlaCarteCartProps = {
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  isCheckingOut?: boolean;
};

export function AlaCarteCart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isCheckingOut = false,
}: AlaCarteCartProps) {
  const totalCents = cart.reduce(
    (sum, item) => sum + item.item.price_cents * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cart.map((cartItem) => (
            <div
              key={cartItem.item.id}
              className="flex items-center gap-3 pb-4 border-b last:border-0 last:pb-0"
            >
              <div className="flex-1">
                <h4 className="font-medium">{cartItem.item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(cartItem.item.price_cents)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onUpdateQuantity(cartItem.item.id, cartItem.quantity - 1)
                  }
                  disabled={isCheckingOut}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onUpdateQuantity(cartItem.item.id, cartItem.quantity + 1)
                  }
                  disabled={isCheckingOut}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatPrice(cartItem.item.price_cents * cartItem.quantity)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveItem(cartItem.item.id)}
                disabled={isCheckingOut}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex items-center justify-between w-full text-lg font-semibold">
          <span>Total:</span>
          <span className="text-primary">{formatPrice(totalCents)}</span>
        </div>
        <Button
          onClick={onCheckout}
          disabled={cart.length === 0 || isCheckingOut}
          className="w-full"
          size="lg"
        >
          {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
        </Button>
      </CardFooter>
    </Card>
  );
}
