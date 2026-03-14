'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Mail, Send, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (resetError) {
      setError(resetError.message);
      setIsSubmitting(false);
      return;
    }

    setSuccess('If an account exists, a password reset link has been sent.');
    setIsSubmitting(false);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-brand-bg px-4 py-8">
      <section className="w-full max-w-lg rounded-3xl border border-brand-border bg-[#121a31]/80 p-8 shadow-layered backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
          <ShieldAlert className="h-10 w-10" />
        </div>

        <h1 className="text-center font-heading text-3xl text-white">Forgot Password</h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm text-brand-muted">
          Enter your registered email and we’ll send a secure reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brand-text">Email</span>
            <div className={`flex items-center rounded-lg border bg-[#0f1630] px-3 ${error ? 'border-red-500' : 'border-brand-border focus-within:border-brand-primary'}`}>
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
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-brand-muted">
          Back to{' '}
          <Link href="/login" className="font-semibold text-white transition hover:text-brand-accent">
            login
          </Link>
        </p>
      </section>
    </main>
  );
}
