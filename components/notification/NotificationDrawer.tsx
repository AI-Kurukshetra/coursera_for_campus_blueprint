'use client';

import { BellRing } from 'lucide-react';
import type { NotificationItem } from '@/types/notification';

type NotificationDrawerProps = {
  open: boolean;
  notifications: NotificationItem[];
  isLoading: boolean;
  isMarkingAll: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotificationClick: (notification: NotificationItem) => void;
};

const formatDateTime = (dateValue: string): string =>
  new Date(dateValue).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const isToday = (value: string): boolean => {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

export function NotificationDrawer({
  open,
  notifications,
  isLoading,
  isMarkingAll,
  onClose,
  onMarkAllRead,
  onNotificationClick,
}: NotificationDrawerProps) {
  const todayNotifications = notifications.filter((item) => isToday(item.created_at));
  const earlierNotifications = notifications.filter((item) => !isToday(item.created_at));

  return (
    <div className={`fixed inset-0 z-50 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md border-l border-brand-border bg-[#0f1734] shadow-layered transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
          <h2 className="font-heading text-2xl text-white">Notifications</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-2 py-1 text-xs font-medium text-brand-text transition hover:border-brand-primary/70"
          >
            Close
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
          <p className="text-xs text-brand-muted">{notifications.length} recent notifications</p>
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={isMarkingAll || notifications.length === 0}
            className="rounded-lg border border-brand-border px-2.5 py-1 text-xs font-semibold text-brand-text transition hover:border-brand-primary/70 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isMarkingAll ? 'Marking...' : 'Mark all read'}
          </button>
        </div>

        <div className="h-[calc(100%-104px)] overflow-y-auto px-3 py-3">
          {isLoading ? <p className="text-sm text-brand-muted">Loading notifications...</p> : null}

          {!isLoading && notifications.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-brand-border bg-[#121a31] p-8 text-center">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary">
                <BellRing className="h-6 w-6" />
              </div>
              <p className="font-medium text-white">No notifications yet</p>
              <p className="mt-1 text-sm text-brand-muted">You’re all caught up for now.</p>
            </div>
          ) : null}

          {!isLoading ? (
            <div className="space-y-5">
              {todayNotifications.length > 0 ? (
                <section>
                  <p className="mb-2 text-xs uppercase tracking-wide text-brand-muted">Today</p>
                  <ul className="space-y-2">
                    {todayNotifications.map((notification) => (
                      <li key={notification.id}>
                        <button
                          type="button"
                          onClick={() => onNotificationClick(notification)}
                          className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                            notification.is_read
                              ? 'border-brand-border bg-[#121a31] hover:border-brand-primary/45'
                              : 'border-brand-primary/50 border-l-4 bg-brand-primary/10 hover:bg-brand-primary/15'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-white">{notification.title}</p>
                            <span className="text-xs text-brand-muted">{formatDateTime(notification.created_at)}</span>
                          </div>
                          {notification.body ? (
                            <p className="mt-1 text-sm text-brand-muted">{notification.body}</p>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {earlierNotifications.length > 0 ? (
                <section>
                  <p className="mb-2 text-xs uppercase tracking-wide text-brand-muted">Earlier</p>
                  <ul className="space-y-2">
                    {earlierNotifications.map((notification) => (
                      <li key={notification.id}>
                        <button
                          type="button"
                          onClick={() => onNotificationClick(notification)}
                          className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                            notification.is_read
                              ? 'border-brand-border bg-[#121a31] hover:border-brand-primary/45'
                              : 'border-brand-primary/50 border-l-4 bg-brand-primary/10 hover:bg-brand-primary/15'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-white">{notification.title}</p>
                            <span className="text-xs text-brand-muted">{formatDateTime(notification.created_at)}</span>
                          </div>
                          {notification.body ? (
                            <p className="mt-1 text-sm text-brand-muted">{notification.body}</p>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
