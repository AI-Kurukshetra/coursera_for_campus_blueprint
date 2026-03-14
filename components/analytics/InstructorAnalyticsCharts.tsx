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
import type { InstructorAnalyticsData } from '@/types/analytics';

type InstructorAnalyticsChartsProps = {
  data: InstructorAnalyticsData;
};

const chartTheme = {
  grid: '#2a3a63',
  axis: '#9db1df',
  tooltipBg: '#111a33',
  tooltipBorder: '#2a3a63',
};

export function InstructorAnalyticsCharts({ data }: InstructorAnalyticsChartsProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-5 shadow-glass">
        <h2 className="font-heading text-2xl text-white">Course Completion & Average Quiz Score</h2>
        <p className="mt-1 text-xs text-brand-muted">Completion and score trend by course.</p>

        <div className="mt-4 h-80 w-full">
          {data.course_performance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.course_performance} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="course_title" tick={{ fontSize: 12, fill: chartTheme.axis }} interval={0} angle={-20} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: chartTheme.axis }} />
                <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="completion_rate" name="Completion Rate %" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="average_quiz_score" name="Avg Quiz Score %" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-muted">No course analytics data yet.</div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-5 shadow-glass">
        <h2 className="font-heading text-2xl text-white">Lesson View Counts</h2>
        <p className="mt-1 text-xs text-brand-muted">Most viewed lessons across your courses.</p>

        <div className="mt-4 h-80 w-full">
          {data.lesson_views.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.lesson_views} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="lesson_title" tick={{ fontSize: 12, fill: chartTheme.axis }} interval={0} angle={-20} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12, fill: chartTheme.axis }} />
                <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 12 }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="lesson_view_count"
                  name="Lesson Views"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-muted">No lesson view events yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
