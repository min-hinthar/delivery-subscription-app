'use client';

import { useEffect, useState } from 'react';
import { Package, MapPin, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/format';

type DashboardStats = {
  todayDeliveries: number;
  completedToday: number;
  pendingDeliveries: number;
  totalDistance: number;
  estimatedTime: number;
  onTimeRate: number;
};

type UpcomingDelivery = {
  id: string;
  customer_name: string;
  address: string;
  window: string;
  status: string;
  eta?: string;
};

export function DriverDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayDeliveries: 0,
    completedToday: 0,
    pendingDeliveries: 0,
    totalDistance: 0,
    estimatedTime: 0,
    onTimeRate: 0,
  });
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<UpcomingDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/driver/dashboard');
      const result = await response.json();

      if (result.ok) {
        setStats(result.data.stats);
        setUpcomingDeliveries(result.data.upcoming || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayDeliveries}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedToday} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDeliveries}</div>
            <p className="text-xs text-muted-foreground">
              Remaining stops
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onTimeRate}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Route Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Route</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Total Distance</p>
              <p className="text-2xl font-bold">{(stats.totalDistance / 1609).toFixed(1)} mi</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Time</p>
              <p className="text-2xl font-bold">{Math.round(stats.estimatedTime / 60)} min</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingDeliveries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No upcoming deliveries
              </p>
            ) : (
              upcomingDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{delivery.customer_name}</h4>
                      <Badge variant={delivery.status === 'completed' ? 'default' : 'secondary'}>
                        {delivery.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3" />
                      {delivery.address}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {delivery.window}
                    </p>
                  </div>
                  {delivery.status === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
