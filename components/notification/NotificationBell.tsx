'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { NotificationDrawer } from '@/components/notification/NotificationDrawer';
import type { ApiResponse } from '@/lib/api/response';
import type { NotificationItem } from '@/types/notification';

type NotificationListData = {
  unread_count: number;
  notifications: NotificationItem[];
};

type NotificationReadData = {
  id: string;
  is_read: boolean;
};

type MarkAllReadData = {
  updated_count: number;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/notifications', {
        method: 'GET',
        cache: 'no-store',
      });

      const result = (await response.json()) as ApiResponse<NotificationListData>;

      if (!response.ok || !result.data) {
        setIsLoading(false);
        return;
      }

      setUnreadCount(Math.max(0, Math.floor(result.data.unread_count)));
      setNotifications(result.data.notifications);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();

    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [loadNotifications]);

  const unreadLabel = useMemo(
    () => (unreadCount > 99 ? '99+' : String(unreadCount)),
    [unreadCount],
  );

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (notification.is_read) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PATCH',
      });

      const result = (await response.json()) as ApiResponse<NotificationReadData>;

      if (!response.ok || !result.data) {
        return;
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id ? { ...item, is_read: result.data?.is_read ?? true } : item,
        ),
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch {
      // Ignore click-mark failures to keep drawer usable.
    }
  };

  const handleMarkAllRead = async () => {
    if (notifications.length === 0) {
      return;
    }

    setIsMarkingAll(true);

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });

      const result = (await response.json()) as ApiResponse<MarkAllReadData>;

      if (!response.ok || !result.data) {
        setIsMarkingAll(false);
        return;
      }

      setNotifications((previous) => previous.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      setIsMarkingAll(false);
    } catch {
      setIsMarkingAll(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded-lg border border-brand-border bg-[#121a31] p-2 text-brand-text transition hover:border-brand-primary/70"
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 ? (
          <>
            <span className="absolute -right-1 -top-1 rounded-full bg-brand-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreadLabel}
            </span>
            <span className="absolute -right-1 -top-1 h-4 w-4 animate-ping rounded-full bg-brand-primary/60" />
          </>
        ) : null}
      </button>

      <NotificationDrawer
        open={open}
        notifications={notifications}
        isLoading={isLoading}
        isMarkingAll={isMarkingAll}
        onClose={() => setOpen(false)}
        onMarkAllRead={() => void handleMarkAllRead()}
        onNotificationClick={(notification) => void handleNotificationClick(notification)}
      />
    </>
  );
}
