'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Package, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils/format';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'delivered'
  | 'cancelled';

export type OrderItem = {
  id: string;
  quantity: number;
  unit_price_cents: number;
  meal_items: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
  };
};

export type Order = {
  id: string;
  week_of: string;
  order_type: 'package' | 'a_la_carte';
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  order_items: OrderItem[];
};

type OrderHistoryListProps = {
  orders: Order[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function OrderHistoryList({
  orders,
  onLoadMore,
  hasMore,
  isLoading,
}: OrderHistoryListProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground mb-4">
            Start by browsing our menu and placing your first order!
          </p>
          <Button asChild>
            <Link href="/menu">Browse Menu</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const isExpanded = expandedOrder === order.id;
        const itemCount = order.order_items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        return (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleOrder(order.id)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge className={STATUS_COLORS[order.status]}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {order.order_type === 'a_la_carte' ? 'À la carte' : 'Package'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Week of {formatDate(order.week_of)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Placed {formatDate(order.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(order.total_cents)}
                  </p>
                  <ChevronRight
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="border-t">
                <div className="space-y-4 pt-4">
                  <h4 className="font-semibold">Order Items:</h4>
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.meal_items.name}</p>
                          {item.meal_items.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.meal_items.description}
                            </p>
                          )}
                          {item.meal_items.category && (
                            <Badge variant="outline" className="mt-2">
                              {item.meal_items.category}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">
                            {item.quantity}x {formatPrice(item.unit_price_cents)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.quantity * item.unit_price_cents)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(order.total_cents)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" asChild className="flex-1">
                      <Link href={`/orders/${order.id}`}>View Details</Link>
                    </Button>
                    {order.status === 'delivered' && (
                      <Button asChild className="flex-1">
                        <Link href="/menu">Reorder</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {hasMore && (
        <div className="text-center pt-4">
          <Button
            onClick={onLoadMore}
            variant="outline"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? 'Loading...' : 'Load More Orders'}
          </Button>
        </div>
      )}
    </div>
  );
}
