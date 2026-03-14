import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import type { SupportTicketStatus } from '@/types/support';
import type { UserRole } from '@/types/user';

type UpdateTicketBody = {
  status?: unknown;
};

type UserRoleRow = {
  id: string;
  role: UserRole | null;
};

type SupportTicketRow = {
  id: string;
  user_id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  resolved_at: string | null;
};

type UpdateTicketContext = {
  params: {
    id: string;
  };
};

const ALLOWED_STATUSES: SupportTicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

const isStatus = (value: string): value is SupportTicketStatus =>
  ALLOWED_STATUSES.includes(value as SupportTicketStatus);

export async function PATCH(request: NextRequest, context: UpdateTicketContext) {
  try {
    const ticketId = context.params.id?.trim();

    if (!ticketId) {
      return jsonResponse(400, null, 'Ticket id is required.');
    }

    let body: UpdateTicketBody | null = null;

    try {
      body = (await request.json()) as UpdateTicketBody;
    } catch {
      return jsonResponse(400, null, 'Invalid JSON payload.');
    }

    const nextStatus = typeof body?.status === 'string' ? body.status.trim() : '';

    if (!isStatus(nextStatus)) {
      return jsonResponse(400, null, 'Status must be open, in_progress, resolved, or closed.');
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id,role')
      .eq('id', user.id)
      .maybeSingle();

    if (userError || !userData) {
      return jsonResponse(403, null, 'User profile not found.');
    }

    const profile = userData as UserRoleRow;

    if (profile.role !== 'admin') {
      return jsonResponse(403, null, 'Only admins can update ticket status.');
    }

    const { data: updatedData, error: updateError } = await supabase
      .from('support_tickets')
      .update({
        status: nextStatus,
        resolved_at:
          nextStatus === 'resolved' || nextStatus === 'closed'
            ? new Date().toISOString()
            : null,
      })
      .eq('id', ticketId)
      .select('id,user_id,subject,description,status,priority,created_at,resolved_at')
      .maybeSingle();

    if (updateError) {
      return jsonResponse(500, null, updateError.message);
    }

    if (!updatedData) {
      return jsonResponse(404, null, 'Ticket not found.');
    }

    return jsonResponse(
      200,
      {
        ticket: updatedData as SupportTicketRow,
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
