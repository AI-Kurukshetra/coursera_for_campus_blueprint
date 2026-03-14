'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AdminReportsData } from '@/types/analytics';

type AdminReportsChartsProps = {
  data: AdminReportsData;
};

const chartTheme = {
  grid: '#2a3a63',
  axis: '#9db1df',
  tooltipBg: '#111a33',
  tooltipBorder: '#2a3a63',
};

export function AdminReportsCharts({ data }: AdminReportsChartsProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-5 shadow-glass">
        <h2 className="font-heading text-2xl text-white">Weekly Enrollments</h2>

        <div className="mt-4 h-72 w-full">
          {data.weekly_enrollments.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weekly_enrollments} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="week_start" tick={{ fontSize: 12, fill: chartTheme.axis }} />
                <YAxis tick={{ fontSize: 12, fill: chartTheme.axis }} />
                <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="enrollments" stroke="#3B82F6" strokeWidth={2} name="Enrollments" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-muted">No enrollment data available.</div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-5 shadow-glass">
        <h2 className="font-heading text-2xl text-white">Monthly Revenue</h2>

        <div className="mt-4 h-72 w-full">
          {data.monthly_revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_revenue} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: chartTheme.axis }} />
                <YAxis tick={{ fontSize: 12, fill: chartTheme.axis }} />
                <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue (USD)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-muted">No paid revenue data available.</div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-5 shadow-glass">
        <h2 className="font-heading text-2xl text-white">Top 5 Courses by Enrollment</h2>

        <div className="mt-4 h-72 w-full">
          {data.top_courses.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_courses} margin={{ top: 10, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="course_title" tick={{ fontSize: 12, fill: chartTheme.axis }} interval={0} angle={-20} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12, fill: chartTheme.axis }} />
                <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="enrollments" name="Enrollments" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-muted">No course enrollment data available.</div>
          )}
        </div>
      </section>
    </div>
  );
}
