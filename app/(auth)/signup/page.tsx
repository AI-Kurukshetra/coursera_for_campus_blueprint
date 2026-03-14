'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowRight, GraduationCap, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { createClient } from '@/lib/supabase/client';
import type { SignupRole } from '@/types/user';

const roles: Array<{ value: SignupRole; title: string; description: string; icon: typeof GraduationCap }> = [
  {
    value: 'student',
    title: 'Student',
    description: 'Enroll in programs, take quizzes, and earn certificates.',
    icon: GraduationCap,
  },
  {
    value: 'instructor',
    title: 'Instructor',
    description: 'Build courses, manage lessons, and track learner outcomes.',
    icon: ShieldCheck,
  },
];

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SignupRole>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Full name, email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setError('Signup succeeded but no user record was returned.');
      setIsSubmitting(false);
      return;
    }

    setSuccess('Account created. Please check your email to verify your account.');
    setIsSubmitting(false);
    router.push('/login');
  };

  return (
    <AuthSplitLayout
      title="Create Your Account"
      subtitle="Join Campus LMS as a student or instructor."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-brand-text">Full name</span>
          <div className={`flex items-center rounded-lg border bg-[#111a33] px-3 ${error && !fullName.trim() ? 'border-red-500' : 'border-brand-border focus-within:border-brand-primary'}`}>
            <UserRound className="h-4 w-4 text-brand-muted" />
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-11 w-full bg-transparent px-2 text-sm text-white outline-none placeholder:text-brand-muted"
              placeholder="Your full name"
              required
            />
          </div>
        </label>

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
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`h-11 w-full rounded-lg border bg-[#111a33] px-3 text-sm text-white outline-none placeholder:text-brand-muted ${error && password.length < 6 ? 'border-red-500' : 'border-brand-border focus:border-brand-primary'}`}
            placeholder="At least 6 characters"
            required
            minLength={6}
          />
        </label>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-brand-text">Choose role</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((roleItem) => {
              const Icon = roleItem.icon;
              const selected = role === roleItem.value;

              return (
                <button
                  key={roleItem.value}
                  type="button"
                  onClick={() => setRole(roleItem.value)}
                  className={`rounded-xl border p-3 text-left transition ${
                    selected
                      ? 'border-brand-primary bg-brand-primary/15 shadow-layered'
                      : 'border-brand-border bg-[#111a33] hover:border-brand-primary/55'
                  }`}
                >
                  <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/20 text-brand-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold text-white">{roleItem.title}</p>
                  <p className="mt-1 text-xs text-brand-muted">{roleItem.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Creating account...' : 'Sign up'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-4 text-sm text-brand-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-white transition hover:text-brand-accent">
          Login
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
