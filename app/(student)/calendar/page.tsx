import { redirect } from 'next/navigation';
import { StudentCalendarView } from '@/components/calendar/StudentCalendarView';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type CalendarEventRow = {
  id: string;
  title: string;
  due_at: string;
  event_type: string;
};

export default async function StudentCalendarPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('calendar_events')
    .select('id,title,due_at,event_type')
    .eq('user_id', user.id)
    .order('due_at', { ascending: true });

  const events = (data ?? []) as CalendarEventRow[];

  return (
    <main className="space-y-4">
      <div>
        <h1 className="font-heading text-4xl text-white">Calendar</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Track deadlines, quizzes, and reminders for your learning journey.
        </p>
      </div>
      <StudentCalendarView events={events} />
    </main>
  );
}
