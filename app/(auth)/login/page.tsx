'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/user';

const routeByRole: Record<Extract<UserRole, 'student' | 'instructor' | 'admin'>, string> = {
  student: '/dashboard',
  instructor: '/instructor/dashboard',
  admin: '/admin/dashboard',
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message ?? 'Unable to sign in.');
      setIsSubmitting(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile?.role) {
      setError(profileError?.message ?? 'User role was not found.');
      setIsSubmitting(false);
      return;
    }

    if (profile.role === 'university_manager') {
      setError('University manager portal is not configured yet.');
      setIsSubmitting(false);
      return;
    }

    const baseDestination = routeByRole[profile.role as keyof typeof routeByRole];

    if (!baseDestination) {
      setError('Role is not authorized for this portal.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.push(baseDestination);
    router.refresh();
  };

  return (
    <AuthSplitLayout
      title="Welcome Back"
      subtitle="Sign in to continue your learning journey."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-brand-text">Email</span>
          <div className={`flex items-center rounded-lg border bg-[#111a33] px-3 ${error && !email.trim() ? 'border-red-500' : 'border-brand-border focus-within:border-brand-primary'}`}>
            <Mail className="h-4 w-4 text-brand-muted" />
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full bg-transparent px-2 text-sm text-white outline-none placeholder:text-brand-muted"
              placeholder="you@university.edu"
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-brand-text">Password</span>
          <div className={`flex items-center rounded-lg border bg-[#111a33] px-3 ${error && !password.trim() ? 'border-red-500' : 'border-brand-border focus-within:border-brand-primary'}`}>
            <Lock className="h-4 w-4 text-brand-muted" />
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full bg-transparent px-2 text-sm text-white outline-none placeholder:text-brand-muted"
              placeholder="Enter password"
              required
            />
          </div>
        </label>

        {error ? (
          <p className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in...' : 'Login'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm text-brand-muted">
        <Link href="/forgot-password" className="transition hover:text-white">
          Forgot password?
        </Link>
        <Link href="/signup" className="transition hover:text-white">
          Create account
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
