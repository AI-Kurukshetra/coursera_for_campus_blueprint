import { ReactNode } from 'react';
import { ProtectedShell } from '@/components/auth/ProtectedShell';

type StudentLayoutProps = {
  children: ReactNode;
};

export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <ProtectedShell homePath="/dashboard" roleLabel="Student">
      {children}
    </ProtectedShell>
  );
}
