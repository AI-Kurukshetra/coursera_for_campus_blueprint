import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import type { NotificationItem, NotificationType } from '@/types/notification';

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean | null;
  metadata: unknown;
  created_at: string;
};

const ALLOWED_TYPES: NotificationType[] = [
  'new_lesson',
  'quiz_graded',
  'certificate_issued',
  'reply',
];

const isNotificationType = (value: string): value is NotificationType =>
  ALLOWED_TYPES.includes(value as NotificationType);

export async function GET(_request: NextRequest) {
  void _request;
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('id', { head: true, count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (countError) {
      return jsonResponse(500, null, countError.message);
    }

    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .select('id,user_id,type,title,body,is_read,metadata,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (notificationError) {
      return jsonResponse(500, null, notificationError.message);
    }

    const notifications: NotificationItem[] = ((notificationData ?? []) as NotificationRow[]).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      type: isNotificationType(row.type) ? row.type : 'reply',
      title: row.title,
      body: row.body,
      is_read: Boolean(row.is_read),
      metadata:
        row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as NotificationItem['metadata'])
          : null,
      created_at: row.created_at,
    }));

    return jsonResponse(
      200,
      {
        unread_count: unreadCount ?? 0,
        notifications,
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
