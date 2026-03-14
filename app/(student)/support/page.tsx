import { redirect } from 'next/navigation';
import { StudentSupportPanel } from '@/components/support';
import { createClient } from '@/lib/supabase/server';
import type { SupportTicket, SupportTicketPriority, SupportTicketStatus } from '@/types/support';

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

const toSupportTicket = (row: SupportTicketRow): SupportTicket => ({
  id: row.id,
  user_id: row.user_id,
  subject: row.subject,
  description: row.description,
  status: row.status as SupportTicketStatus,
  priority: row.priority as SupportTicketPriority,
  created_at: row.created_at,
  resolved_at: row.resolved_at,
});

export default async function StudentSupportPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('support_tickets')
    .select('id,user_id,subject,description,status,priority,created_at,resolved_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const initialTickets = ((data ?? []) as SupportTicketRow[]).map(toSupportTicket);

  return <StudentSupportPanel initialTickets={initialTickets} />;
}
