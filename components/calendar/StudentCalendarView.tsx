'use client';

import { useMemo } from 'react';

type CalendarEvent = {
  id: string;
  title: string;
  due_at: string;
  event_type: string;
};

type StudentCalendarViewProps = {
  events: CalendarEvent[];
};

const eventTypeColor = (type: string): string => {
  if (type === 'quiz') {
    return 'bg-rose-500';
  }

  if (type === 'deadline') {
    return 'bg-amber-500';
  }

  if (type === 'lesson') {
    return 'bg-blue-500';
  }

  return 'bg-emerald-500';
};

export function StudentCalendarView({ events }: StudentCalendarViewProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstWeekday = new Date(currentYear, currentMonth, 1).getDay();

  const slots = useMemo(() => {
    const leading = Array.from({ length: firstWeekday }).map((_, index) => ({
      key: `leading-${index}`,
      day: null as number | null,
    }));

    const monthDays = Array.from({ length: daysInMonth }).map((_, index) => ({
      key: `day-${index + 1}`,
      day: index + 1,
    }));

    return [...leading, ...monthDays];
  }, [daysInMonth, firstWeekday]);

  const eventsByDay = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    const date = new Date(event.due_at);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      const day = date.getDate();
      const existing = eventsByDay.get(day) ?? [];
      existing.push(event);
      eventsByDay.set(day, existing);
    }
  }

  const todayAgenda = events
    .filter((event) => {
      const date = new Date(event.due_at);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    })
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-xl border border-brand-border/70 bg-white p-4 text-slate-900 shadow-layered">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-3xl text-slate-900">{monthLabel}</h2>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-slate-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {slots.map((slot) => {
            if (slot.day === null) {
              return <div key={slot.key} className="h-24 rounded-lg bg-slate-100/70" />;
            }

            const dayEvents = eventsByDay.get(slot.day) ?? [];
            const isToday = slot.day === now.getDate();

            return (
              <div
                key={slot.key}
                className={`h-24 rounded-lg border p-2 ${
                  isToday ? 'border-brand-primary bg-blue-50' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-xs font-semibold text-slate-700">{slot.day}</p>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${eventTypeColor(event.event_type)}`} />
                      <span className="truncate text-[11px] text-slate-600">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
          {[
            { label: 'Quiz', type: 'quiz' },
            { label: 'Deadline', type: 'deadline' },
            { label: 'Lesson', type: 'lesson' },
            { label: 'Reminder', type: 'reminder' },
          ].map((item) => (
            <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              <span className={`h-2.5 w-2.5 rounded-full ${eventTypeColor(item.type)}`} />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-4 text-brand-text shadow-glass">
        <h3 className="font-heading text-2xl text-white">Today’s Agenda</h3>
        {todayAgenda.length === 0 ? (
          <p className="mt-3 text-sm text-brand-muted">No events scheduled for today.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {todayAgenda.map((event) => (
              <li key={event.id} className="rounded-lg border border-brand-border bg-[#0f1734] px-3 py-2">
                <p className="text-sm font-medium text-white">{event.title}</p>
                <p className="mt-1 text-xs text-brand-muted">
                  {new Date(event.due_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
