import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ok, bad } from '@/lib/api/response';
import { AlaCarteItem } from '@/types/a-la-carte';

/**
 * GET /api/a-la-carte/items
 * Fetch available à la carte menu items
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const dayOfWeek = searchParams.get('day_of_week');

    let query = supabase
      .from('a_la_carte_items')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    if (dayOfWeek) {
      query = query.eq('available_day', dayOfWeek);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching à la carte items:', error);
      return bad('Failed to fetch menu items', { details: { error: error.message  }});
    }

    return ok({ items: data as AlaCarteItem[] });
  } catch (error) {
    console.error('Error in à la carte items endpoint:', error);
    return bad('Internal server error');
  }
}
