'use client';

import { useState } from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlaCarteItem, CartItem } from '@/types/a-la-carte';
import { formatPrice } from '@/lib/utils/format';

type AlaCarteMenuProps = {
  items: AlaCarteItem[];
  onAddToCart: (item: AlaCarteItem, quantity: number) => void;
  cart: CartItem[];
};

export function AlaCarteMenu({ items, onAddToCart, cart }: AlaCarteMenuProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, AlaCarteItem[]>);

  const handleQuantityChange = (itemId: string, delta: number) => {
    const currentQty = quantities[itemId] || 0;
    const newQty = Math.max(0, currentQty + delta);
    setQuantities({ ...quantities, [itemId]: newQty });
  };

  const handleAddToCart = (item: AlaCarteItem) => {
    const quantity = quantities[item.id] || 1;
    onAddToCart(item, quantity);
    // Reset quantity after adding
    setQuantities({ ...quantities, [item.id]: 0 });
  };

  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.find((ci) => ci.item.id === itemId);
    return cartItem?.quantity || 0;
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category}>
          <h2 className="text-2xl font-bold mb-4 text-foreground">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryItems.map((item) => {
              const quantity = quantities[item.id] || 0;
              const cartQty = getCartQuantity(item.id);
              const isAvailable = item.available_quantity === undefined || item.available_quantity > 0;

              return (
                <Card key={item.id} className={!isAvailable ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        {item.available_day && (
                          <Badge variant="outline" className="mt-1">
                            {item.available_day}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">
                          {formatPrice(item.price_cents)}
                        </p>
                      </div>
                    </div>
                    {item.description && (
                      <CardDescription className="mt-2">{item.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {item.available_quantity !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          Available: {item.available_quantity} remaining
                        </p>
                      )}

                      {cartQty > 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          <ShoppingCart className="inline h-4 w-4 mr-1" />
                          {cartQty} in cart
                        </p>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={quantity === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">{quantity || 0}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(item.id, 1)}
                            disabled={!isAvailable}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          onClick={() => handleAddToCart(item)}
                          disabled={quantity === 0 || !isAvailable}
                          className="flex-1"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
