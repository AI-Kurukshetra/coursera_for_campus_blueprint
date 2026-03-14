import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <header className="border-b border-brand-border/70 bg-[#0f1734]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-accent">Campus LMS</p>
            <h1 className="font-heading text-2xl text-white">The Future of University Learning</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary/70">
              Login
            </Link>
            <Link href="/signup" className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-brand-border bg-gradient-to-br from-[#1b2b59] via-[#203a79] to-[#284ea1] p-8 shadow-layered">
          <h2 className="font-heading text-5xl text-white">Learn, Build, and Graduate Online.</h2>
          <p className="mt-4 max-w-2xl text-sm text-blue-100/90">
            Campus LMS helps universities deliver online degrees, assessments, certificates, and outcomes-focused learning at scale.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/courses" className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-amber-400">
              Explore Courses
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-[#101935] px-5 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-primary/70">
              For Universities
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Students', value: '50K+' },
            { label: 'Courses', value: '200+' },
            { label: 'Universities', value: '30+' },
            { label: 'Completion Rate', value: '95%' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-brand-border bg-[#121a31]/80 p-4 shadow-glass">
              <p className="text-3xl font-semibold text-white">{item.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-brand-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: BookOpen, title: 'Premium Course Delivery' },
            { icon: Building2, title: 'University-Grade Management' },
            { icon: Sparkles, title: 'Verified Certificates & Analytics' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-xl border border-brand-border bg-[#121a31]/80 p-5 shadow-glass">
                <Icon className="h-6 w-6 text-brand-primary" />
                <h3 className="mt-3 font-heading text-2xl text-white">{item.title}</h3>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
