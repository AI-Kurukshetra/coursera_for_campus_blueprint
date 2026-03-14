import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';

type ReadNotificationContext = {
  params: {
    id: string;
  };
};

type NotificationReadRow = {
  id: string;
  is_read: boolean | null;
};

export async function PATCH(_request: NextRequest, context: ReadNotificationContext) {
  try {
    const notificationId = context.params.id?.trim();

    if (!notificationId) {
      return jsonResponse(400, null, 'Notification id is required.');
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const { data: updatedData, error: updatedError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select('id,is_read')
      .maybeSingle();

    if (updatedError) {
      return jsonResponse(500, null, updatedError.message);
    }

    if (!updatedData) {
      return jsonResponse(404, null, 'Notification not found.');
    }

    const updated = updatedData as NotificationReadRow;

    return jsonResponse(
      200,
      {
        id: updated.id,
        is_read: Boolean(updated.is_read),
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
