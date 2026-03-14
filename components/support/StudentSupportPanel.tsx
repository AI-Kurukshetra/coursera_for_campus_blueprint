'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { ApiResponse } from '@/lib/api/response';
import type { SupportTicket, SupportTicketPriority, SupportTicketStatus } from '@/types/support';

type StudentSupportPanelProps = {
  initialTickets: SupportTicket[];
};

type TicketCreateResponseData = {
  ticket: SupportTicket;
};

const STATUS_BADGE_CLASS: Record<SupportTicketStatus, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-700',
};

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

export function StudentSupportPanel({ initialTickets }: StudentSupportPanelProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SupportTicketPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedTickets = useMemo(
    () => [...tickets].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
    [tickets],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();

    if (trimmedSubject.length < 3) {
      setError('Subject must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: trimmedSubject,
          description: trimmedDescription,
          priority,
        }),
      });

      const result = (await response.json()) as ApiResponse<TicketCreateResponseData>;

      if (!response.ok || !result.data?.ticket) {
        setError(result.error ?? 'Unable to submit ticket.');
        setIsSubmitting(false);
        return;
      }

      setTickets((previous) => [result.data!.ticket, ...previous]);
      setSubject('');
      setDescription('');
      setPriority('medium');
      setIsSubmitting(false);
    } catch {
      setError('Unexpected error while creating ticket.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Need help?</h2>
        <p className="mt-1 text-sm text-gray-600">Create a support ticket and track its status.</p>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
          <div>
            <label htmlFor="subject" className="mb-1 block text-sm font-medium text-gray-700">
              Subject
            </label>
            <input
              id="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              placeholder="Describe your issue"
            />
          </div>

          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as SupportTicketPriority)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-fit rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900">My Tickets</h3>

        {sortedTickets.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No tickets yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sortedTickets.map((ticket) => (
              <li key={ticket.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-gray-500">Created: {formatDate(ticket.created_at)}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      STATUS_BADGE_CLASS[ticket.status]
                    }`}
                  >
                    {formatStatus(ticket.status)}
                  </span>
                </div>

                {ticket.description ? (
                  <p className="mt-2 text-sm text-gray-700">{ticket.description}</p>
                ) : null}

                <p className="mt-2 text-xs text-gray-600">Priority: {ticket.priority}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
