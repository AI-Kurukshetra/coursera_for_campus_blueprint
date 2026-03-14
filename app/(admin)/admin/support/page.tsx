import { notFound, redirect } from 'next/navigation';
import { AdminSupportPanel } from '@/components/support';
import { createClient } from '@/lib/supabase/server';
import type { AdminSupportTicket, SupportTicketPriority, SupportTicketStatus } from '@/types/support';
import type { UserRole } from '@/types/user';

export const dynamic = 'force-dynamic';

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

type UserRow = {
  id: string;
  role: UserRole | null;
  full_name: string | null;
  email: string | null;
};

const toAdminTicket = (
  row: SupportTicketRow,
  requester: UserRow | undefined,
): AdminSupportTicket => ({
  id: row.id,
  user_id: row.user_id,
  subject: row.subject,
  description: row.description,
  status: row.status as SupportTicketStatus,
  priority: row.priority as SupportTicketPriority,
  created_at: row.created_at,
  resolved_at: row.resolved_at,
  requester_name: requester?.full_name ?? requester?.email ?? 'Student',
  requester_email: requester?.email ?? null,
});

export default async function AdminSupportPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profileData } = await supabase
    .from('users')
    .select('id,role,full_name,email')
    .eq('id', user.id)
    .maybeSingle();

  if (!profileData || (profileData as UserRow).role !== 'admin') {
    notFound();
  }

  const { data: ticketRows } = await supabase
    .from('support_tickets')
    .select('id,user_id,subject,description,status,priority,created_at,resolved_at')
    .order('created_at', { ascending: false });

  const tickets = (ticketRows ?? []) as SupportTicketRow[];
  const requesterIds = Array.from(new Set(tickets.map((ticket) => ticket.user_id)));

  const { data: userRows } = requesterIds.length
    ? await supabase
        .from('users')
        .select('id,role,full_name,email')
        .in('id', requesterIds)
    : { data: [] as UserRow[] };

  const requesterMap = new Map<string, UserRow>(((userRows ?? []) as UserRow[]).map((row) => [row.id, row]));
  const initialTickets = tickets.map((ticket) => toAdminTicket(ticket, requesterMap.get(ticket.user_id)));

  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Admin Support Panel</h1>
        <p className="mt-1 text-sm text-gray-600">Review and update student support ticket status.</p>
      </div>
      <AdminSupportPanel initialTickets={initialTickets} />
    </main>
  );
}
