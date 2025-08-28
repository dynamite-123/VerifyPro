'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/logo';
import StatusBadge from '@/components/ui/status-badge';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo size="md" />
          <div>
            <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all font-light">
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-light text-gray-800 mb-6">Welcome to VerifyPro</h1>
        
        {/* Document verification status */}
        <div className="bg-white p-6 shadow-sm rounded-lg mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Document Verification Status</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-700">Aadhar Card</span>
              </div>
              
              <StatusBadge status="pending" text="Not Uploaded" />
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-700">PAN Card</span>
              </div>
              
              <StatusBadge status="pending" text="Not Uploaded" />
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm text-gray-700">Digital Signature</span>
              </div>
              
              <StatusBadge status="pending" text="Not Uploaded" />
            </div>
          </div>
          
          <div className="mt-6">
            <Link 
              href="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all"
            >
              Upload Documents
            </Link>
          </div>
        </div>
        
        {/* Other dashboard sections can be added here */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 shadow-sm rounded-lg">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Account Information</h2>
            <p className="text-sm text-gray-500">
              View and update your account information including personal details and security settings.
            </p>
            <div className="mt-4">
              <button className="text-sm text-gray-700 hover:text-blue-600 hover:underline transition-all">
                View Account Details →
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 shadow-sm rounded-lg">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Verification History</h2>
            <p className="text-sm text-gray-500">
              Review your document verification history and status updates.
            </p>
            <div className="mt-4">
              <button className="text-sm text-gray-700 hover:text-blue-600 hover:underline transition-all">
                View History →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
