import { redirect } from 'next/navigation';
import { Award, BookOpen, Flame, TrendingUp } from 'lucide-react';
import { EnrollmentCourseCard } from '@/components/course';
import { EmptyState, GlassCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { getStudentEnrollmentCards } from '@/services/enrollmentService';

export const dynamic = 'force-dynamic';

type UserProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type AnalyticsEventRow = {
  event_type: string;
  created_at: string;
};

type CalendarEventRow = {
  id: string;
  title: string;
  due_at: string;
};

const formatShortDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const toActivityLabel = (eventType: string): string => {
  if (eventType === 'lesson_view') {
    return 'Viewed a lesson';
  }

  if (eventType === 'video_play') {
    return 'Played a lesson video';
  }

  if (eventType === 'quiz_attempt') {
    return 'Attempted a quiz';
  }

  if (eventType === 'course_enroll') {
    return 'Enrolled in a course';
  }

  return 'Learning activity';
};

export default async function StudentDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [enrollments, profileResponse, certificatesCountResponse, activityResponse, calendarResponse] =
    await Promise.all([
      getStudentEnrollmentCards(user.id),
      supabase.from('users').select('id,full_name,email').eq('id', user.id).maybeSingle(),
      supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('student_id', user.id),
      supabase
        .from('analytics_events')
        .select('event_type,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('calendar_events')
        .select('id,title,due_at')
        .eq('user_id', user.id)
        .gte('due_at', new Date().toISOString())
        .order('due_at', { ascending: true })
        .limit(5),
    ]);

  const profile = (profileResponse.data as UserProfileRow | null) ?? null;
  const fullName = profile?.full_name ?? profile?.email ?? 'Learner';

  const completedCourses = enrollments.filter((item) => item.completion_percentage >= 100).length;
  const averageProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((total, item) => total + item.completion_percentage, 0) /
            enrollments.length,
        )
      : 0;

  const rawEvents = (activityResponse.data ?? []) as AnalyticsEventRow[];
  const activityItems = rawEvents.map((item) => ({
    label: toActivityLabel(item.event_type),
    date: formatShortDate(item.created_at),
  }));

  const distinctDays = new Set(
    rawEvents.map((item) => new Date(item.created_at).toISOString().slice(0, 10)),
  );
  const streakDays = Math.max(1, Math.min(30, distinctDays.size));

  const upcomingDeadlines = (calendarResponse.data ?? []) as CalendarEventRow[];

  return (
    <main className="space-y-6">
      <GlassCard className="overflow-hidden bg-gradient-to-r from-[#1a2650] via-[#1a2f67] to-[#3B82F6]/40">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brand-accent">Student Dashboard</p>
            <h2 className="mt-2 font-heading text-3xl text-white">Welcome back, {fullName}</h2>
            <p className="mt-2 text-sm text-blue-100/90">
              Keep your momentum going with guided learning and measurable progress.
            </p>
          </div>
          <div className="grid h-28 w-28 place-items-center rounded-full border-4 border-brand-accent/60 bg-[#0f1734]/70">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{averageProgress}%</p>
              <p className="text-[11px] uppercase tracking-wide text-blue-100">Progress</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Enrolled Courses', value: enrollments.length, icon: BookOpen },
          { label: 'Completed', value: completedCourses, icon: TrendingUp },
          { label: 'Certificates', value: certificatesCountResponse.count ?? 0, icon: Award },
          { label: 'Streak Days', value: streakDays, icon: Flame },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.label} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-brand-muted">{stat.label}</p>
                  <p className="mt-1 text-3xl font-semibold text-white">{stat.value}</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/20 text-brand-primary">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </GlassCard>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-2xl text-white">Enrolled Courses</h3>
            <p className="text-sm text-brand-muted">{enrollments.length} courses</p>
          </div>

          {enrollments.length === 0 ? (
            <EmptyState
              title="No enrollments yet"
              description="Browse the course catalog and enroll in your first course to begin learning."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {enrollments.map((enrollment) => (
                <EnrollmentCourseCard
                  key={enrollment.enrollment_id}
                  enrollment={enrollment}
                />
              ))}
            </div>
          )}
        </GlassCard>

        <div className="space-y-6">
          <GlassCard>
            <h3 className="font-heading text-xl text-white">Recent Activity</h3>
            {activityItems.length === 0 ? (
              <p className="mt-3 text-sm text-brand-muted">No recent activity yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {activityItems.map((item) => (
                  <li key={`${item.label}-${item.date}`} className="flex items-center justify-between rounded-lg bg-[#0f1734] px-3 py-2">
                    <span className="text-sm text-brand-text">{item.label}</span>
                    <span className="text-xs text-brand-muted">{item.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="font-heading text-xl text-white">Upcoming Deadlines</h3>
            {upcomingDeadlines.length === 0 ? (
              <p className="mt-3 text-sm text-brand-muted">No upcoming deadlines scheduled.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {upcomingDeadlines.map((item) => (
                  <li key={item.id} className="rounded-lg border border-brand-border/60 bg-[#0f1734] px-3 py-2">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-brand-muted">Due: {formatShortDate(item.due_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </section>
    </main>
  );
}
