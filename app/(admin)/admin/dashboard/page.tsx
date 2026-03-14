import { notFound, redirect } from 'next/navigation';
import { AdminReportsCharts } from '@/components/analytics';
import { GlassCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { getAdminReportsData } from '@/services/analyticsService';
import type { UserRole } from '@/types/user';

type UserProfileRow = {
  id: string;
  role: UserRole | null;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole | null;
  created_at: string;
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default async function AdminDashboardPage() {
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

  const [reportsData, usersCountResponse, universitiesCountResponse, coursesCountResponse, signupsResponse] =
    await Promise.all([
      getAdminReportsData(),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('universities').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase
        .from('users')
        .select('id,full_name,email,role,created_at')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

  const recentSignups = (signupsResponse.data ?? []) as UserRow[];
  const totalRevenue = reportsData.monthly_revenue.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl text-white">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Institutional overview for platform health, enrollments, and growth.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Universities', value: universitiesCountResponse.count ?? 0 },
          { label: 'Students', value: usersCountResponse.count ?? 0 },
          { label: 'Revenue', value: `$${totalRevenue.toFixed(0)}` },
          { label: 'Active Courses', value: coursesCountResponse.count ?? 0 },
        ].map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-brand-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
          </GlassCard>
        ))}
      </section>

      <AdminReportsCharts data={reportsData} />

      <section className="overflow-hidden rounded-xl border border-brand-border/70 bg-[#121a31]/80 shadow-glass">
        <div className="border-b border-brand-border/60 px-4 py-3">
          <h3 className="font-heading text-2xl text-white">Recent Signups</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#101935] text-left text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentSignups.length > 0 ? (
                recentSignups.map((signup) => (
                  <tr key={signup.id} className="border-t border-brand-border/60">
                    <td className="px-4 py-3 text-brand-text">{signup.full_name ?? 'User'}</td>
                    <td className="px-4 py-3 text-brand-muted">{signup.email ?? 'N/A'}</td>
                    <td className="px-4 py-3 text-brand-muted">{signup.role ?? 'student'}</td>
                    <td className="px-4 py-3 text-brand-muted">{formatDate(signup.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-brand-muted">
                    No recent signups.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
