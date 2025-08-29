'use client';

import { ReactNode } from 'react';
import withAuth from '@/components/auth/with-auth';

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  );
}

export default withAuth(DashboardLayout);
