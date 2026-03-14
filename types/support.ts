export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type SupportTicketPriority = 'low' | 'medium' | 'high';

export type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  description: string | null;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  created_at: string;
  resolved_at: string | null;
};

export type AdminSupportTicket = SupportTicket & {
  requester_name: string;
  requester_email: string | null;
};
