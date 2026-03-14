'use client';

import { useMemo, useState } from 'react';
import type { ApiResponse } from '@/lib/api/response';
import type { AdminSupportTicket, SupportTicketStatus } from '@/types/support';

type AdminSupportPanelProps = {
  initialTickets: AdminSupportTicket[];
};

type UpdateTicketResponseData = {
  ticket: {
    id: string;
    status: SupportTicketStatus;
    resolved_at: string | null;
  };
};

const STATUS_BADGE_CLASS: Record<SupportTicketStatus, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-700',
};

const ALL_STATUSES: Array<'all' | SupportTicketStatus> = [
  'all',
  'open',
  'in_progress',
  'resolved',
  'closed',
];

const formatStatus = (status: SupportTicketStatus): string =>
  status.replace('_', ' ');

const formatDate = (value: string): string =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export function AdminSupportPanel({ initialTickets }: AdminSupportPanelProps) {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>(initialTickets);
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicketStatus>('all');
  const [actionTicketId, setActionTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') {
      return tickets;
    }

    return tickets.filter((ticket) => ticket.status === statusFilter);
  }, [tickets, statusFilter]);

  const handleStatusUpdate = async (ticketId: string, nextStatus: SupportTicketStatus) => {
    setError(null);
    setActionTicketId(ticketId);

    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = (await response.json()) as ApiResponse<UpdateTicketResponseData>;

      if (!response.ok || !result.data?.ticket) {
        setError(result.error ?? 'Unable to update ticket status.');
        setActionTicketId(null);
        return;
      }

      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: result.data!.ticket.status,
                resolved_at: result.data!.ticket.resolved_at,
              }
            : ticket,
        ),
      );

      setActionTicketId(null);
    } catch {
      setError('Unexpected error while updating ticket status.');
      setActionTicketId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">Support Tickets</h2>

          <div className="flex items-center gap-2">
            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">
              Filter
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | SupportTicketStatus)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              {ALL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All' : formatStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Update</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">
                      <p className="font-medium">{ticket.requester_name}</p>
                      <p className="text-xs text-gray-500">{ticket.requester_email ?? 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p className="font-medium text-gray-900">{ticket.subject}</p>
                      {ticket.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{ticket.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700">{ticket.priority}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          STATUS_BADGE_CLASS[ticket.status]
                        }`}
                      >
                        {formatStatus(ticket.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(ticket.created_at)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={ticket.status}
                        onChange={(event) =>
                          void handleStatusUpdate(ticket.id, event.target.value as SupportTicketStatus)
                        }
                        disabled={actionTicketId === ticket.id}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {ALL_STATUSES.filter((status) => status !== 'all').map((status) => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-600">
                    No tickets for selected status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
