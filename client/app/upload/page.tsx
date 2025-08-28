'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadContainer from '@/components/upload/upload-container';
import FileUpload from '@/components/upload/file-upload';
import StatusBadge from '@/components/ui/status-badge';

interface UploadFormData {
  aadharCard: File | null;
  panCard: File | null;
}

// Placeholder for verification status
interface VerificationStatus {
  aadhar: 'pending' | 'success' | 'error' | 'warning' | null;
  pan: 'pending' | 'success' | 'error' | 'warning' | null;
}

export default function UploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState<UploadFormData>({
    aadharCard: null,
    panCard: null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    aadhar: null,
    pan: null
  });
  
  const handleFileUpload = (field: keyof UploadFormData) => (file: File) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
    
    // Clear error when file is uploaded
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.aadharCard) {
      newErrors.aadharCard = 'Please upload your Aadhar Card';
    }
    
    if (!formData.panCard) {
      newErrors.panCard = 'Please upload your PAN Card';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setIsVerifying(true);
    
    try {
      // Simulate verification process
      setVerificationStatus({
        aadhar: 'pending',
        pan: 'pending'
      });
      
      // Simulate API request timing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update status one by one with delays to simulate real verification
      setVerificationStatus(prev => ({
        ...prev,
        aadhar: 'success'
      }));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVerificationStatus(prev => ({
        ...prev,
        pan: 'success'
      }));
      
      // In a real application, you would submit the files to your backend here
      /* 
      const formDataToSend = new FormData();
      if (formData.aadharCard) formDataToSend.append('aadharCard', formData.aadharCard);
      if (formData.panCard) formDataToSend.append('panCard', formData.panCard);
      
      const response = await fetch('/api/upload-documents', {
        method: 'POST',
        body: formDataToSend
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Handle success
      } else {
        // Handle error
        setErrors({ form: data.error || 'An error occurred during submission' });
      }
      */
      
    } catch (error) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
      
      // Reset verification status on error
      setVerificationStatus({
        aadhar: 'error',
        pan: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (status: 'pending' | 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'pending': return 'Processing';
      case 'success': return 'Verified';
      case 'error': return 'Failed';
      case 'warning': return 'Review Needed';
    }
  };

  const isAllVerified = () => {
    return (
      verificationStatus.aadhar === 'success' && 
      verificationStatus.pan === 'success'
    );
  };

  const hasVerificationErrors = () => {
    return (
      verificationStatus.aadhar === 'error' || 
      verificationStatus.pan === 'error'
    );
  };

  return (
    <UploadContainer
      title="Document Verification"
      subtitle="Upload your documents for verification to complete your profile"
    >
      {errors.form && (
        <div className="p-3.5 bg-red-50 border border-red-100 text-red-500 rounded-lg text-xs font-light mb-6">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Aadhar Card Section */}
        <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Aadhar Card</h3>
            {verificationStatus.aadhar && (
              <StatusBadge 
                status={verificationStatus.aadhar} 
                text={getStatusText(verificationStatus.aadhar)} 
              />
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Please upload a clear, high-resolution image of your Aadhar Card. Make sure all details are visible.
          </p>
          <FileUpload
            title="Aadhar Card"
            subtitle="JPG, PNG or PDF up to 5MB"
            acceptedFileTypes=".jpg,.jpeg,.png,.pdf"
            onFileSelected={handleFileUpload('aadharCard')}
            error={errors.aadharCard}
          />
        </div>
        
        {/* PAN Card Section */}
        <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">PAN Card</h3>
            {verificationStatus.pan && (
              <StatusBadge 
                status={verificationStatus.pan} 
                text={getStatusText(verificationStatus.pan)} 
              />
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Please upload a clear, high-resolution image of your PAN Card. Make sure all details are visible.
          </p>
          <FileUpload
            title="PAN Card"
            subtitle="JPG, PNG or PDF up to 5MB"
            acceptedFileTypes=".jpg,.jpeg,.png,.pdf"
            onFileSelected={handleFileUpload('panCard')}
            error={errors.panCard}
          />
        </div>
        
        {/* Submit and Verification Section */}
        <div className="mt-8">
          {isVerifying ? (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Verification Status</h3>
              
              {isAllVerified() && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-green-800">
                      All documents have been successfully verified!
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-green-600">
                    Your account has been fully verified. You can now access all features of VerifyPro.
                  </p>
                  <div className="mt-4">
                    <button 
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg transition-all hover:bg-gray-800"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              )}
              
              {hasVerificationErrors() && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-red-800">
                      Some verification issues were detected
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-red-600">
                    Please check your documents and ensure they meet our requirements.
                  </p>
                  <div className="mt-4">
                    <button 
                      type="button"
                      onClick={() => setIsVerifying(false)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg transition-all hover:bg-gray-800"
                    >
                      Retry Upload
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-normal"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Verify Documents'}
            </button>
          )}
        </div>
      </form>
    </UploadContainer>
  );
}
