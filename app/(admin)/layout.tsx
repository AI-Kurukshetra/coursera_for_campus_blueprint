import { ReactNode } from 'react';
import { ProtectedShell } from '@/components/auth/ProtectedShell';

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedShell homePath="/admin/dashboard" roleLabel="Admin">
      {children}
    </ProtectedShell>
  );
}
