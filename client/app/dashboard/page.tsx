'use client';

import React from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/status-badge';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-5 mb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome to Verify<span className='text-green-600'>Pro</span></h1>
                <p className="mt-2 text-sm text-gray-600 max-w-lg">
                  Your trusted platform for secure document verification and digital identity management.
                </p>
              </div>
            </div>
          </div>
          
          {/* Document verification status */}
          <div className="bg-white p-8 shadow-md rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Document Verification Status</h2>
              <Link 
                href="/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Documents
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-all">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2.5 rounded-lg mr-4">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Aadhar Card</span>
                    <p className="text-xs text-gray-500 mt-0.5">Government-issued ID card</p>
                  </div>
                </div>
                
                <StatusBadge status="pending" text="Not Uploaded" />
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-all">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2.5 rounded-lg mr-4">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">PAN Card</span>
                    <p className="text-xs text-gray-500 mt-0.5">Permanent Account Number</p>
                  </div>
                </div>
                
                <StatusBadge status="pending" text="Not Uploaded" />
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-all">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2.5 rounded-lg mr-4">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Digital Signature</span>
                    <p className="text-xs text-gray-500 mt-0.5">For document authentication</p>
                  </div>
                </div>
                
                <StatusBadge status="pending" text="Not Uploaded" />
              </div>
            </div>
          </div>
          
          {/* Quick actions and information cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 shadow-md rounded-xl hover:shadow-lg transition-all">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Account Information</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                View and update your account information including personal details and security settings.
              </p>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center group">
                View Account Details 
                <svg className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="bg-white p-6 shadow-md rounded-xl hover:shadow-lg transition-all">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Verification History</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Review your document verification history and status updates from our secure platform.
              </p>
              <button className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center group">
                View History 
                <svg className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
