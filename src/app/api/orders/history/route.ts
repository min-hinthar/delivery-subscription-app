import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ok, bad } from '@/lib/api/response';

/**
 * GET /api/orders/history
 * Fetch customer's order history with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return bad('Authentication required', { code: 'UNAUTHORIZED', status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const orderType = searchParams.get('type'); // 'package' or 'a_la_carte'
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        id,
        week_of,
        order_type,
        status,
        total_cents,
        created_at,
        updated_at,
        order_items (
          id,
          meal_item_id,
          quantity,
          unit_price_cents,
          is_a_la_carte,
          meal_items (
            id,
            name,
            description,
            category
          )
        ),
        delivery_appointments (
          id,
          delivery_window_id,
          delivery_windows (
            day_of_week,
            start_time,
            end_time
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (orderType) {
      query = query.eq('order_type', orderType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching order history:', error);
      return bad('Failed to fetch order history', { details: { error: error.message  }});
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return ok({
      orders: orders || [],
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error in order history endpoint:', error);
    return bad('Internal server error');
  }
}
