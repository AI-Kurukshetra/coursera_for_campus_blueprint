import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';

type NotificationReadRow = {
  id: string;
};

export async function PATCH(_request: NextRequest) {
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

    const { data: updatedData, error: updatedError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .select('id');

    if (updatedError) {
      return jsonResponse(500, null, updatedError.message);
    }

    const updatedRows = (updatedData ?? []) as NotificationReadRow[];

    return jsonResponse(
      200,
      {
        updated_count: updatedRows.length,
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
