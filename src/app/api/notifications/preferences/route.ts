import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ok, bad } from '@/lib/api/response';
import { z } from 'zod';

const PreferencesSchema = z.object({
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  order_updates: z.boolean().optional(),
  delivery_reminders: z.boolean().optional(),
  promotional: z.boolean().optional(),
});

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return bad('Authentication required', { code: 'UNAUTHORIZED', status: 401 });
    }

    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return bad('Failed to fetch preferences', { details: { error: error.message  }});
    }

    // Return default preferences if none exist
    if (!preferences) {
      return ok({
        preferences: {
          email_enabled: true,
          push_enabled: true,
          sms_enabled: false,
          order_updates: true,
          delivery_reminders: true,
          promotional: false,
        },
      });
    }

    return ok({ preferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return bad('Internal server error');
  }
}

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return bad('Authentication required', { code: 'UNAUTHORIZED', status: 401 });
    }

    const body = await request.json();
    const validationResult = PreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      return bad('Invalid request data', {
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let preferences;

    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(validationResult.data)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return bad('Failed to update preferences', { details: { error: error.message  }});
      }
      preferences = data;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          ...validationResult.data,
        })
        .select()
        .single();

      if (error) {
        return bad('Failed to create preferences', { details: { error: error.message  }});
      }
      preferences = data;
    }

    return ok({ preferences });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return bad('Internal server error');
  }
}
