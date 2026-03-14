import { notFound, redirect } from 'next/navigation';
import { AdminReportsCharts } from '@/components/analytics';
import { createClient } from '@/lib/supabase/server';
import { getAdminReportsData } from '@/services/analyticsService';
import type { UserRole } from '@/types/user';

export const dynamic = 'force-dynamic';

type UserProfileRow = {
  id: string;
  role: UserRole | null;
};

export default async function AdminReportsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profileData } = await supabase
    .from('users')
    .select('id,role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profileData || (profileData as UserProfileRow).role !== 'admin') {
    notFound();
  }

  const reportsData = await getAdminReportsData();

  return (
    <main className="space-y-4">
      <div>
        <h1 className="font-heading text-4xl text-white">Admin Reports</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Weekly enrollments, monthly revenue, and top courses by enrollment.
        </p>
      </div>

      <AdminReportsCharts data={reportsData} />
    </main>
  );
}
