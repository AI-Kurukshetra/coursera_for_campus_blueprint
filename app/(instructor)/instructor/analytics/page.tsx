import { redirect } from 'next/navigation';
import { InstructorAnalyticsCharts } from '@/components/analytics';
import { createClient } from '@/lib/supabase/server';
import { getInstructorAnalyticsData } from '@/services/analyticsService';

export const dynamic = 'force-dynamic';

export default async function InstructorAnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const analyticsData = await getInstructorAnalyticsData(user.id);

  return (
    <main className="space-y-4">
      <div>
        <h1 className="font-heading text-4xl text-white">Instructor Analytics</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Course completion rate, average quiz score, and lesson engagement trends.
        </p>
      </div>

      <InstructorAnalyticsCharts data={analyticsData} />
    </main>
  );
}
