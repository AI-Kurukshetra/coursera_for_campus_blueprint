'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Home,
  LifeBuoy,
  LineChart,
  Shield,
  Sparkles,
} from 'lucide-react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { NotificationBell } from '@/components/notification';

type ProtectedShellProps = {
  children: ReactNode;
  homePath:
    | '/student'
    | '/dashboard'
    | '/courses'
    | '/instructor'
    | '/admin'
    | '/instructor/dashboard'
    | '/admin/dashboard';
  roleLabel: 'Student' | 'Instructor' | 'Admin';
};

export function ProtectedShell({ children, homePath, roleLabel }: ProtectedShellProps) {
  const pathname = usePathname();

  const navItems = (
    roleLabel === 'Student'
      ? [
          { href: '/dashboard', label: 'Dashboard', icon: Home },
          { href: '/courses', label: 'Courses', icon: BookOpen },
          { href: '/progress', label: 'Progress', icon: LineChart },
          { href: '/calendar', label: 'Calendar', icon: CalendarDays },
          { href: '/certificates', label: 'Certificates', icon: GraduationCap },
          { href: '/support', label: 'Support', icon: LifeBuoy },
        ]
      : roleLabel === 'Instructor'
        ? [
            { href: '/instructor/dashboard', label: 'Dashboard', icon: Home },
            { href: '/instructor/courses', label: 'Courses', icon: BookOpen },
            { href: '/instructor/analytics', label: 'Analytics', icon: BarChart3 },
            { href: '/instructor', label: 'Overview', icon: Sparkles },
          ]
        : [
            { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
            { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
            { href: '/admin/support', label: 'Support', icon: LifeBuoy },
            { href: '/admin', label: 'Overview', icon: Shield },
          ]
  );

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <header className="sticky top-0 z-40 border-b border-brand-border/80 bg-[#0d1328cc] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-5 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/20 text-brand-primary">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-accent">
                {roleLabel} Portal
              </p>
              <h1 className="font-heading text-lg text-white">Campus LMS</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href={homePath}
              className="rounded-lg border border-brand-border bg-[#121a31] px-3 py-2 text-sm font-medium text-brand-text transition hover:border-brand-primary/70 hover:text-white"
            >
              Home
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-6 px-5 py-6 md:px-6 lg:grid-cols-[270px_1fr]">
        <aside className="hidden rounded-xl border border-brand-border/70 bg-[#121a31]/70 p-4 shadow-glass backdrop-blur-xl lg:block">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-primary/20 text-white shadow-layered'
                      : 'text-brand-muted hover:bg-[#1a2549] hover:text-brand-text'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
