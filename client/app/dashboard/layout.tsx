'use client';

import { ReactNode } from 'react';
import withAuth from '@/components/auth/with-auth';

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  return children;
}

export default withAuth(DashboardLayout);
