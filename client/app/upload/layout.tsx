'use client';

import { ReactNode } from 'react';
import withAuth from '@/components/auth/with-auth';

interface UploadLayoutProps {
  children: ReactNode;
}

function UploadLayout({ children }: UploadLayoutProps) {
  return (
    <div className="bg-gradient-to-br from-stone-50 to-gray-50 min-h-screen">
      <div className="container mx-auto">
        {children}
      </div>
    </div>
  );
}

export default withAuth(UploadLayout);
