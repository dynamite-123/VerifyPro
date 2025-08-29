import React from 'react';

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
  <div className="min-h-screen w-full bg-gray-100 text-slate-900">
      {/* Top spacing and optional header area (keeps navbar from overlapping) */}
      <div className="w-full p-6">
        <header className="max-w-full mx-auto mb-4">
          <h1 className="text-2xl font-semibold">Help & Support</h1>
          <p className="text-sm text-slate-500">Ask questions about KYC, uploads and verification</p>
        </header>

        <main className="w-full">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
