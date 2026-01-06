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
    const { data: currentOrders, error: currentOrdersError } = await supabase
      .from('orders')
      .select('total_cents')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed');

    if (currentOrdersError) {
      console.error('Failed to fetch current orders:', currentOrdersError);
      return bad('Failed to fetch revenue data', { status: 500, details: { error: currentOrdersError.message } });
    }

    const { data: previousOrders, error: previousOrdersError } = await supabase
      .from('orders')
      .select('total_cents')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())
      .eq('status', 'completed');

    if (previousOrdersError) {
      console.error('Failed to fetch previous orders:', previousOrdersError);
      return bad('Failed to fetch revenue data', { status: 500, details: { error: previousOrdersError.message } });
    }

    const currentRevenue = currentOrders?.reduce((sum, o) => sum + o.total_cents, 0) || 0;
    const previousRevenue = previousOrders?.reduce((sum, o) => sum + o.total_cents, 0) || 0;
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Fetch customer data
    const { count: totalCustomers, error: totalCustomersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (totalCustomersError) {
      console.error('Failed to fetch total customers:', totalCustomersError);
      return bad('Failed to fetch customer data', { status: 500, details: { error: totalCustomersError.message } });
    }

    const { count: activeCustomers, error: activeCustomersError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trialing']);

    if (activeCustomersError) {
      console.error('Failed to fetch active customers:', activeCustomersError);
      return bad('Failed to fetch customer data', { status: 500, details: { error: activeCustomersError.message } });
    }

    const { count: newCustomers, error: newCustomersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    if (newCustomersError) {
      console.error('Failed to fetch new customers:', newCustomersError);
      return bad('Failed to fetch customer data', { status: 500, details: { error: newCustomersError.message } });
    }

    // Fetch order data
    const { data: allOrders, count: totalOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('total_cents', { count: 'exact' })
      .gte('created_at', startDate.toISOString());

    if (allOrdersError) {
      console.error('Failed to fetch orders:', allOrdersError);
      return bad('Failed to fetch order data', { status: 500, details: { error: allOrdersError.message } });
    }

    const averageValue = allOrders && allOrders.length > 0
      ? allOrders.reduce((sum, o) => sum + o.total_cents, 0) / allOrders.length
      : 0;

    // Fetch delivery data
    const { count: scheduledDeliveries, error: scheduledDeliveriesError } = await supabase
      .from('delivery_appointments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    if (scheduledDeliveriesError) {
      console.error('Failed to fetch scheduled deliveries:', scheduledDeliveriesError);
      return bad('Failed to fetch delivery data', { status: 500, details: { error: scheduledDeliveriesError.message } });
    }

    const { count: completedDeliveries, error: completedDeliveriesError } = await supabase
      .from('delivery_stops')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString());

    if (completedDeliveriesError) {
      console.error('Failed to fetch completed deliveries:', completedDeliveriesError);
      return bad('Failed to fetch delivery data', { status: 500, details: { error: completedDeliveriesError.message } });
    }

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
    return bad('Internal server error', {
      status: 500,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
}
