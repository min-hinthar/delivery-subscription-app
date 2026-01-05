import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ok, bad } from '@/lib/api/response';
import { z } from 'zod';

const SendNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
  delivery_method: z.enum(['email', 'push', 'sms']).optional(),
});

/**
 * POST /api/notifications/send
 * Send a notification to a user (internal API)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // This endpoint should be protected - only internal services should call it
    // In production, add proper authentication/authorization

    const body = await request.json();
    const validationResult = SendNotificationSchema.safeParse(body);

    if (!validationResult.success) {
      return bad('Invalid request data', {
        details: { errors: validationResult.error.flatten().fieldErrors },
      });
    }

    const { user_id, type, title, message, data, delivery_method } = validationResult.data;

    // Get user preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    // Check if user has enabled this type of notification
    const shouldSend = preferences
      ? checkNotificationEnabled(preferences, type, delivery_method)
      : true;

    if (!shouldSend) {
      return ok({ sent: false, reason: 'User preferences disabled this notification' });
    }

    // Store notification in database
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        data,
        delivery_method: delivery_method || 'push',
      })
      .select()
      .single();

    if (error) {
      return bad('Failed to create notification', { details: { error: error.message  }});
    }

    // Here you would integrate with actual notification services:
    // - Resend for emails
    // - Push notification service (FCM, APNs)
    // - Twilio for SMS

    // For now, just log it
    console.log('Notification created:', notification);

    return ok({
      sent: true,
      notification_id: notification.id,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return bad('Internal server error');
  }
}

type NotificationPreferences = {
  email_enabled: boolean | null;
  push_enabled: boolean | null;
  sms_enabled: boolean | null;
  order_updates: boolean | null;
  delivery_reminders: boolean | null;
  promotional: boolean | null;
};

type NotificationDeliveryMethod = 'email' | 'push' | 'sms' | undefined;

function checkNotificationEnabled(
  preferences: NotificationPreferences,
  type: string,
  method?: NotificationDeliveryMethod
): boolean {
  // Check if the delivery method is enabled
  if (method === 'email' && !preferences.email_enabled) return false;
  if (method === 'push' && !preferences.push_enabled) return false;
  if (method === 'sms' && !preferences.sms_enabled) return false;

  // Check if the notification type is enabled
  if (type.includes('order') && !preferences.order_updates) return false;
  if (type.includes('delivery') && !preferences.delivery_reminders) return false;
  if (type.includes('promo') && !preferences.promotional) return false;

  return true;
}
