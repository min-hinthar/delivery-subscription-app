import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { ok, bad } from '@/lib/api/response';

/**
 * GET /api/admin/analytics
 * Fetch admin analytics dashboard data
 */
export async function GET(request: Request) {
  try {
    const { supabase, isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return bad('Admin access required', { code: 'FORBIDDEN', status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }

    // Fetch revenue data
    const { data: currentOrders } = await supabase
      .from('orders')
      .select('total_cents')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed');

    const { data: previousOrders } = await supabase
      .from('orders')
      .select('total_cents')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())
      .eq('status', 'completed');

    const currentRevenue = currentOrders?.reduce((sum, o) => sum + o.total_cents, 0) || 0;
    const previousRevenue = previousOrders?.reduce((sum, o) => sum + o.total_cents, 0) || 0;
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Fetch customer data
    const { count: totalCustomers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeCustomers } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trialing']);

    const { count: newCustomers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // Fetch order data
    const { data: allOrders, count: totalOrders } = await supabase
      .from('orders')
      .select('total_cents', { count: 'exact' })
      .gte('created_at', startDate.toISOString());

    const averageValue = allOrders && allOrders.length > 0
      ? allOrders.reduce((sum, o) => sum + o.total_cents, 0) / allOrders.length
      : 0;

    // Fetch delivery data
    const { count: scheduledDeliveries } = await supabase
      .from('delivery_appointments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    const { count: completedDeliveries } = await supabase
      .from('delivery_stops')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString());

    const onTimeRate = scheduledDeliveries && scheduledDeliveries > 0
      ? ((completedDeliveries || 0) / scheduledDeliveries) * 100
      : 0;

    // Calculate churn rate (simplified)
    const churnRate = totalCustomers && totalCustomers > 0
      ? ((totalCustomers - (activeCustomers || 0)) / totalCustomers) * 100
      : 0;

    return ok({
      revenue: {
        total: currentRevenue,
        thisMonth: currentRevenue,
        lastMonth: previousRevenue,
        growth: revenueGrowth,
      },
      customers: {
        total: totalCustomers || 0,
        active: activeCustomers || 0,
        new: newCustomers || 0,
        churnRate,
      },
      orders: {
        total: totalOrders || 0,
        thisWeek: totalOrders || 0,
        averageValue,
        fulfillmentRate: 100,
      },
      deliveries: {
        scheduled: scheduledDeliveries || 0,
        completed: completedDeliveries || 0,
        pending: (scheduledDeliveries || 0) - (completedDeliveries || 0),
        onTimeRate,
      },
    });
  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    return bad('Internal server error');
  }
}
