import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ok, bad } from '@/lib/api/response';
import { z } from 'zod';

const AlaCarteOrderSchema = z.object({
  week_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(
    z.object({
      item_id: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  delivery_window_id: z.string().uuid(),
});

/**
 * POST /api/a-la-carte/order
 * Create a new à la carte order
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return bad('Authentication required', { code: 'UNAUTHORIZED', status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = AlaCarteOrderSchema.safeParse(body);

    if (!validationResult.success) {
      return bad('Invalid request data', {
        details: { errors: validationResult.error.flatten().fieldErrors },
      });
    }

    const { week_of, items: orderItems, delivery_window_id } = validationResult.data;

    // Fetch item details and calculate total
    const itemIds = orderItems.map(item => item.item_id);
    const { data: menuItems, error: itemsError } = await supabase
      .from('meal_items')
      .select('id, name, price_cents, available_for_a_la_carte, is_active')
      .in('id', itemIds);

    if (itemsError || !menuItems) {
      return bad('Failed to fetch menu items', { details: { error: itemsError?.message  }});
    }

    // Validate all items are available for à la carte
    const unavailableItems = menuItems.filter(
      item => !item.is_active || !item.available_for_a_la_carte
    );

    if (unavailableItems.length > 0) {
      return bad('Some items are not available for à la carte ordering', {
        details: { unavailable: unavailableItems.map(item => item.name) },
      });
    }

    // Calculate total
    let totalCents = 0;
    const itemsMap = new Map(menuItems.map(item => [item.id, item]));

    for (const orderItem of orderItems) {
      const menuItem = itemsMap.get(orderItem.item_id);
      if (!menuItem) {
        return bad('Invalid item in order', { details: { item_id: orderItem.item_id } });
      }
      totalCents += menuItem.price_cents * orderItem.quantity;
    }

    // Create order in transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        week_of,
        order_type: 'a_la_carte',
        status: 'pending',
        total_cents: totalCents,
      })
      .select()
      .single();

    if (orderError || !order) {
      return bad('Failed to create order', { details: { error: orderError?.message  }});
    }

    // Create order items
    const orderItemsData = orderItems.map(item => {
      const menuItem = itemsMap.get(item.item_id);
      return {
        order_id: order.id,
        meal_item_id: item.item_id,
        quantity: item.quantity,
        unit_price_cents: menuItem!.price_cents,
        is_a_la_carte: true,
      };
    });

    const { error: itemsInsertError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsInsertError) {
      // Rollback order creation
      const { error: rollbackError } = await supabase.from('orders').delete().eq('id', order.id);
      if (rollbackError) {
        console.error('Failed to rollback order creation:', rollbackError);
      }
      return bad('Failed to create order items', { status: 500, details: { error: itemsInsertError.message } });
    }

    // Create delivery appointment
    const { error: appointmentError } = await supabase
      .from('delivery_appointments')
      .insert({
        user_id: user.id,
        week_of,
        delivery_window_id,
      });

    if (appointmentError) {
      console.error('Failed to create delivery appointment:', appointmentError);
      // Don't fail the order, but log the error
    }

    // Return success with order details
    return ok({
      order: {
        id: order.id,
        total_cents: totalCents,
        status: order.status,
        items: orderItems,
      },
    });
  } catch (error) {
    console.error('Error creating à la carte order:', error);
    return bad('Internal server error', {
      status: 500,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
}

/**
 * GET /api/a-la-carte/order
 * Get user's à la carte orders
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return bad('Authentication required', { code: 'UNAUTHORIZED', status: 401 });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        week_of,
        order_type,
        status,
        total_cents,
        created_at,
        order_items (
          meal_item_id,
          quantity,
          unit_price_cents,
          meal_items (
            name,
            description
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('order_type', 'a_la_carte')
      .order('created_at', { ascending: false });

    if (error) {
      return bad('Failed to fetch orders', { details: { error: error.message  }});
    }

    return ok({ orders });
  } catch (error) {
    console.error('Error fetching à la carte orders:', error);
    return bad('Internal server error', {
      status: 500,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
}
