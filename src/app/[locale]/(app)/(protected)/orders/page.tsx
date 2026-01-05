'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { OrderHistoryList } from '@/components/orders/order-history-list';
import type { Order } from '@/components/orders/order-history-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

type OrderType = 'all' | 'package' | 'a_la_carte';
type OrderStatus = 'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('all');
  const [status, setStatus] = useState<OrderStatus>('all');

  useEffect(() => {
    fetchOrders(1, orderType, status);
  }, [orderType, status]);

  const fetchOrders = async (
    pageNum: number,
    type: OrderType,
    statusFilter: OrderStatus
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
      });

      if (type !== 'all') {
        params.set('type', type);
      }

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/orders/history?${params.toString()}`);
      const result = await response.json();

      if (result.ok) {
        if (pageNum === 1) {
          setOrders(result.data.orders);
        } else {
          setOrders((prev) => [...prev, ...result.data.orders]);
        }
        setHasMore(result.data.pagination.hasMore);
        setPage(pageNum);
      } else {
        toast({
          title: 'Error loading orders',
          description: result.error?.message || 'Failed to load orders',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchOrders(page + 1, orderType, status);
  };

  const handleFilterChange = (type: OrderType, statusFilter: OrderStatus) => {
    setOrderType(type);
    setStatus(statusFilter);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Order History"
        description="View and manage your past orders"
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select
              label="Order Type"
              value={orderType}
              onChange={(value) =>
                handleFilterChange(value as OrderType, status)
              }
              options={[
                { label: 'All Orders', value: 'all' },
                { label: 'Package Orders', value: 'package' },
                { label: 'À La Carte', value: 'a_la_carte' },
              ]}
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <Select
              label="Status"
              value={status}
              onChange={(value) =>
                handleFilterChange(orderType, value as OrderStatus)
              }
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'Delivered', value: 'delivered' },
                { label: 'Cancelled', value: 'cancelled' },
              ]}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => handleFilterChange('all', 'all')}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Order List */}
      {isLoading && page === 1 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <OrderHistoryList
          orders={orders}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
