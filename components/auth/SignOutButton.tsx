'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignOut = async () => {
    setIsSubmitting(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    setIsSubmitting(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSubmitting}
      className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-[#121a31] px-3 py-2 text-sm font-medium text-brand-text transition hover:border-brand-accent/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
    >
      <LogOut className="h-4 w-4" />
      {isSubmitting ? 'Signing out...' : 'Sign out'}
    </button>
  );
}
