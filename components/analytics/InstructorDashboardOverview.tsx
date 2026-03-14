'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type RevenuePoint = {
  month: string;
  revenue: number;
};

type CoursePerformanceRow = {
  id: string;
  title: string;
  enrollments: number;
  completionRate: number;
  rating: number;
};

type InstructorDashboardOverviewProps = {
  revenuePoints: RevenuePoint[];
  performanceRows: CoursePerformanceRow[];
};

export function InstructorDashboardOverview({
  revenuePoints,
  performanceRows,
}: InstructorDashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-5 shadow-glass">
        <h3 className="font-heading text-2xl text-white">Revenue (Last 6 Months)</h3>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenuePoints} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#2a3a63" />
              <XAxis dataKey="month" stroke="#9db1df" />
              <YAxis stroke="#9db1df" />
              <Tooltip
                contentStyle={{
                  background: '#111a33',
                  border: '1px solid #2a3a63',
                  color: '#f8fafc',
                  borderRadius: 12,
                }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-brand-border/70 bg-[#121a31]/80 shadow-glass">
        <div className="border-b border-brand-border/60 px-4 py-3">
          <h3 className="font-heading text-2xl text-white">Course Performance</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#101935] text-left text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Enrollments</th>
                <th className="px-4 py-3">Completion %</th>
                <th className="px-4 py-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {performanceRows.length > 0 ? (
                performanceRows.map((row) => (
                  <tr key={row.id} className="border-t border-brand-border/60">
                    <td className="px-4 py-3 text-brand-text">{row.title}</td>
                    <td className="px-4 py-3 text-brand-muted">{row.enrollments}</td>
                    <td className="px-4 py-3 text-brand-muted">{row.completionRate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-amber-300">★ {row.rating.toFixed(1)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-brand-muted">
                    No course performance data yet.
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
