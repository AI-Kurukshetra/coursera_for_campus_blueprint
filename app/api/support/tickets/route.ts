import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import type { AdminSupportTicket, SupportTicket, SupportTicketPriority, SupportTicketStatus } from '@/types/support';
import type { UserRole } from '@/types/user';

type CreateTicketBody = {
  subject?: unknown;
  description?: unknown;
  priority?: unknown;
};

type UserRoleRow = {
  id: string;
  role: UserRole | null;
  full_name: string | null;
  email: string | null;
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

const ALLOWED_PRIORITIES: SupportTicketPriority[] = ['low', 'medium', 'high'];
const ALLOWED_STATUSES: SupportTicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

const isPriority = (value: string): value is SupportTicketPriority =>
  ALLOWED_PRIORITIES.includes(value as SupportTicketPriority);

const isStatus = (value: string): value is SupportTicketStatus =>
  ALLOWED_STATUSES.includes(value as SupportTicketStatus);

const toSupportTicket = (row: SupportTicketRow): SupportTicket => ({
  id: row.id,
  user_id: row.user_id,
  subject: row.subject,
  description: row.description,
  status: isStatus(row.status) ? row.status : 'open',
  priority: isPriority(row.priority) ? row.priority : 'medium',
  created_at: row.created_at,
  resolved_at: row.resolved_at,
});

const parseRequestBody = async (request: NextRequest): Promise<CreateTicketBody | null> => {
  try {
    return (await request.json()) as CreateTicketBody;
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const priorityValue = typeof body?.priority === 'string' ? body.priority.trim() : '';

    if (subject.length < 3 || subject.length > 200) {
      return jsonResponse(400, null, 'Subject must be between 3 and 200 characters.');
    }

    if (!isPriority(priorityValue)) {
      return jsonResponse(400, null, 'Priority must be low, medium, or high.');
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
      .select('id,role,full_name,email')
      .eq('id', user.id)
      .maybeSingle();

    if (userError || !userData) {
      return jsonResponse(403, null, 'User profile not found.');
    }

    const profile = userData as UserRoleRow;

    if (profile.role !== 'student') {
      return jsonResponse(403, null, 'Only students can create support tickets.');
    }

    const { data: ticketData, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        description: description.length > 0 ? description : null,
        priority: priorityValue,
        status: 'open',
      })
      .select('id,user_id,subject,description,status,priority,created_at,resolved_at')
      .single();

    if (ticketError || !ticketData) {
      return jsonResponse(500, null, ticketError?.message ?? 'Unable to create ticket.');
    }

    return jsonResponse(
      201,
      {
        ticket: toSupportTicket(ticketData as SupportTicketRow),
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}

export async function GET(request: NextRequest) {
  try {
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
      .select('id,role,full_name,email')
      .eq('id', user.id)
      .maybeSingle();

    if (userError || !userData) {
      return jsonResponse(403, null, 'User profile not found.');
    }

    const profile = userData as UserRoleRow;

    const statusFilter = request.nextUrl.searchParams.get('status')?.trim() ?? '';
    const effectiveStatus = isStatus(statusFilter) ? statusFilter : null;

    let ticketQuery = supabase
      .from('support_tickets')
      .select('id,user_id,subject,description,status,priority,created_at,resolved_at')
      .order('created_at', { ascending: false });

    if (effectiveStatus) {
      ticketQuery = ticketQuery.eq('status', effectiveStatus);
    }

    if (profile.role !== 'admin') {
      ticketQuery = ticketQuery.eq('user_id', user.id);
    }

    const { data: ticketRows, error: ticketError } = await ticketQuery;

    if (ticketError) {
      return jsonResponse(500, null, ticketError.message);
    }

    const tickets = ((ticketRows ?? []) as SupportTicketRow[]).map(toSupportTicket);

    if (profile.role !== 'admin') {
      return jsonResponse(
        200,
        {
          requester_role: profile.role,
          tickets,
        },
        null,
      );
    }

    const requesterIds = Array.from(new Set(tickets.map((ticket) => ticket.user_id)));

    const { data: requesterRows } = requesterIds.length
      ? await supabase
          .from('users')
          .select('id,role,full_name,email')
          .in('id', requesterIds)
      : { data: [] as UserRoleRow[] };

    const requesterMap = new Map<string, UserRoleRow>(
      ((requesterRows ?? []) as UserRoleRow[]).map((row) => [row.id, row]),
    );

    const adminTickets: AdminSupportTicket[] = tickets.map((ticket) => {
      const requester = requesterMap.get(ticket.user_id);

      return {
        ...ticket,
        requester_name: requester?.full_name ?? requester?.email ?? 'Student',
        requester_email: requester?.email ?? null,
      };
    });

    return jsonResponse(
      200,
      {
        requester_role: profile.role,
        tickets: adminTickets,
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
