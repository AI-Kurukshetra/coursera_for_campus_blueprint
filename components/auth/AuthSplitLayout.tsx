import { ReactNode } from 'react';
import { GraduationCap, Sparkles, Zap } from 'lucide-react';

type AuthSplitLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthSplitLayout({ title, subtitle, children }: AuthSplitLayoutProps) {
  return (
    <main className="min-h-screen bg-brand-bg px-4 py-6 sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-3xl border border-brand-border/80 bg-[#0f1630]/90 shadow-layered lg:grid-cols-[1.1fr_1fr]">
        <section className="relative hidden overflow-hidden border-r border-brand-border/70 p-10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(59,130,246,0.26),transparent_55%),radial-gradient(circle_at_76%_82%,rgba(245,158,11,0.22),transparent_52%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand-primary">
                <GraduationCap className="h-4 w-4" />
                Campus LMS
              </div>
              <h1 className="mt-8 max-w-md font-heading text-5xl leading-tight text-white">
                Learn Beyond Classrooms.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-brand-muted">
                A premium learning platform for universities to run online courses, assessments, and career-focused certifications.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Sparkles, label: 'Cinematic lessons and modern course experiences' },
                { icon: Zap, label: 'Fast progress tracking and verified certificates' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-brand-border bg-[#121a31]/75 px-4 py-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/20 text-brand-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm text-brand-text">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-accent">Campus LMS</p>
            <h2 className="mt-3 font-heading text-3xl text-white">{title}</h2>
            <p className="mt-2 text-sm text-brand-muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
