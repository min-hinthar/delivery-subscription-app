'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { AlaCarteMenu } from '@/components/menu/a-la-carte-menu';
import { AlaCarteCart } from '@/components/menu/a-la-carte-cart';
import { AlaCarteItem, CartItem } from '@/types/a-la-carte';
import { toast } from '@/components/ui/use-toast';

export default function AlaCartePage() {
  const router = useRouter();
  const [items, setItems] = useState<AlaCarteItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    fetchItems();
    // Load cart from localStorage
    const savedCart = localStorage.getItem('alaCarteCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse saved cart:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('alaCarteCart', JSON.stringify(cart));
  }, [cart]);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/a-la-carte/items');
      const result = await response.json();

      if (result.ok) {
        setItems(result.data.items);
      } else {
        toast({
          title: 'Error loading menu',
          description: result.error?.message || 'Failed to load menu items',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (item: AlaCarteItem, quantity: number) => {
    const existingItemIndex = cart.findIndex((ci) => ci.item.id === item.id);

    if (existingItemIndex >= 0) {
      // Update existing item
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += quantity;
      setCart(newCart);
    } else {
      // Add new item
      setCart([...cart, { item, quantity }]);
    }

    toast({
      title: 'Added to cart',
      description: `${quantity}x ${item.name} added to your cart`,
    });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setCart(
      cart.map((ci) =>
        ci.item.id === itemId ? { ...ci, quantity } : ci
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(cart.filter((ci) => ci.item.id !== itemId));
    toast({
      title: 'Removed from cart',
      description: 'Item removed from your cart',
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add items to your cart before checking out',
        variant: 'destructive',
      });
      return;
    }

    // Navigate to checkout with cart data
    router.push('/a-la-carte/checkout');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="À La Carte Menu"
        description="Order individual dishes without a meal plan package"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AlaCarteMenu
            items={items}
            onAddToCart={handleAddToCart}
            cart={cart}
          />
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <AlaCarteCart
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onCheckout={handleCheckout}
              isCheckingOut={isCheckingOut}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
