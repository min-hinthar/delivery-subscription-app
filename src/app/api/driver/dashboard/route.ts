import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ok, bad } from '@/lib/api/response';

/**
 * GET /api/driver/dashboard
 * Fetch driver dashboard statistics and upcoming deliveries
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify driver authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return bad('Authentication required', { code: 'UNAUTHORIZED', status: 401 });
    }

    // Get driver profile
    const { data: driver, error: driverError } = await supabase
      .from('driver_profiles')
      .select('id, status')
      .eq('id', user.id)
      .single();

    if (driverError || !driver) {
      return bad('Driver profile not found', { code: 'NOT_FOUND', status: 404 });
    }

    if (driver.status !== 'active') {
      return bad('Driver account is not active', { code: 'INACTIVE' });
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Fetch today's routes for this driver
    const { data: routes, error: routesError } = await supabase
      .from('delivery_routes')
      .select(`
        id,
        distance_meters,
        duration_seconds,
        delivery_stops (
          id,
          status,
          eta,
          completed_at,
          delivery_appointments (
            id,
            profiles (
              full_name
            ),
            addresses (
              line1,
              city,
              state
            ),
            delivery_windows (
              day_of_week,
              start_time,
              end_time
            )
          )
        )
      `)
      .eq('driver_id', driver.id)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (routesError) {
      console.error('Error fetching routes:', routesError);
      return bad('Failed to fetch routes', { details: { error: routesError.message  }});
    }

    // Calculate stats
    const stats = {
      todayDeliveries: 0,
      completedToday: 0,
      pendingDeliveries: 0,
      totalDistance: 0,
      estimatedTime: 0,
      onTimeRate: 95, // Placeholder - would calculate from historical data
    };

    const upcomingDeliveries: any[] = [];

    if (routes && routes.length > 0) {
      routes.forEach((route: any) => {
        stats.totalDistance += route.distance_meters || 0;
        stats.estimatedTime += route.duration_seconds || 0;

        if (route.delivery_stops) {
          route.delivery_stops.forEach((stop: any) => {
            stats.todayDeliveries++;

            if (stop.status === 'completed') {
              stats.completedToday++;
            } else {
              stats.pendingDeliveries++;

              // Add to upcoming deliveries
              const appointment = stop.delivery_appointments;
              if (appointment) {
                upcomingDeliveries.push({
                  id: stop.id,
                  customer_name: appointment.profiles?.full_name || 'Customer',
                  address: appointment.addresses
                    ? `${appointment.addresses.line1}, ${appointment.addresses.city}, ${appointment.addresses.state}`
                    : 'Address not available',
                  window: appointment.delivery_windows
                    ? `${appointment.delivery_windows.day_of_week} ${appointment.delivery_windows.start_time}-${appointment.delivery_windows.end_time}`
                    : 'TBD',
                  status: stop.status,
                  eta: stop.eta,
                });
              }
            }
          });
        }
      });
    }

    return ok({
      stats,
      upcoming: upcomingDeliveries,
    });
  } catch (error) {
    console.error('Error in driver dashboard endpoint:', error);
    return bad('Internal server error');
  }
}
