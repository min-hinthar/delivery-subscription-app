import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ok, bad } from '@/lib/api/response';
import { z } from 'zod';

const CreateReviewSchema = z.object({
  order_id: z.string().uuid(),
  meal_item_id: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/**
 * POST /api/reviews
 * Create a new review
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return bad('Authentication required', { code: 'UNAUTHORIZED', status: 401 });
    }

    const body = await request.json();
    const validationResult = CreateReviewSchema.safeParse(body);

    if (!validationResult.success) {
      return bad('Invalid request data', {
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const { order_id, meal_item_id, rating, comment } = validationResult.data;

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return bad('Order not found', { code: 'NOT_FOUND', status: 404 });
    }

    if (order.status !== 'completed' && order.status !== 'delivered') {
      return bad('Can only review completed orders');
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('order_id', order_id)
      .eq('meal_item_id', meal_item_id || null)
      .maybeSingle();

    if (existingReview) {
      return bad('Review already exists for this item');
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        order_id,
        meal_item_id,
        rating,
        comment,
      })
      .select()
      .single();

    if (reviewError || !review) {
      return bad('Failed to create review', { details: { error: reviewError?.message  }});
    }

    return ok({ review });
  } catch (error) {
    console.error('Error creating review:', error);
    return bad('Internal server error');
  }
}

/**
 * GET /api/reviews
 * Get reviews with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;

    const mealItemId = searchParams.get('meal_item_id');
    const orderId = searchParams.get('order_id');
    const minRating = searchParams.get('min_rating');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        profiles (
          full_name
        ),
        meal_items (
          name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (mealItemId) {
      query = query.eq('meal_item_id', mealItemId);
    }

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    if (minRating) {
      query = query.gte('rating', parseInt(minRating));
    }

    const { data: reviews, error, count } = await query;

    if (error) {
      return bad('Failed to fetch reviews', { details: { error: error.message  }});
    }

    return ok({
      reviews: reviews || [],
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return bad('Internal server error');
  }
}
