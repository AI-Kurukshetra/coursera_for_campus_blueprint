import { ReactNode } from 'react';
import { ProtectedShell } from '@/components/auth/ProtectedShell';

type InstructorLayoutProps = {
  children: ReactNode;
};

export default function InstructorLayout({ children }: InstructorLayoutProps) {
  return (
    <ProtectedShell homePath="/instructor/dashboard" roleLabel="Instructor">
      {children}
    </ProtectedShell>
  );
}
