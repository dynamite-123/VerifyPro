'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UploadContainer from '@/components/upload/upload-container';
import FileUpload from '@/components/upload/file-upload';
import StatusBadge from '@/components/ui/status-badge';
import { uploadService } from '@/services/upload';
import { useAuth } from '@/contexts/auth-context';

interface UploadFormData {
  aadhaarFront: File | null;
  aadhaarBack: File | null;
  panCard: File | null;
}

// Verification status for each document
interface VerificationStatus {
  aadhaar: 'pending' | 'success' | 'error' | 'warning' | null;
  pan: 'pending' | 'success' | 'error' | 'warning' | null;
}

export default function UploadPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState<UploadFormData>({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    aadhaar: null,
    pan: null
  });
  
  // Check existing verification status on mount
  useEffect(() => {
    if (user?.aadhaarCard?.aadhaar_number) {
      setVerificationStatus(prev => ({
        ...prev,
        aadhaar: user?.aadhaarCard?.verified ? 'success' : 'pending'
      }));
    }
    
    if (user?.panCard?.pan_number) {
      setVerificationStatus(prev => ({
        ...prev,
        pan: user?.panCard?.verified ? 'success' : 'pending'
      }));
    }
  }, [user]);
  
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
    
    if (!formData.aadhaarFront) {
      newErrors.aadhaarFront = 'Please upload your Aadhaar Card (front side)';
    }
    
    if (!formData.aadhaarBack) {
      newErrors.aadhaarBack = 'Please upload your Aadhaar Card (back side)';
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
      // Clear any previous errors
      setErrors({});
      
      // Initialize verification status
      setVerificationStatus({
        aadhaar: 'pending',
        pan: 'pending'
      });
      
      // Upload Aadhaar card (front and back)
      if (formData.aadhaarFront && formData.aadhaarBack) {
        const aadhaarResponse = await uploadService.uploadAadhaarCard(
          formData.aadhaarFront,
          formData.aadhaarBack
        );
        
        if (aadhaarResponse.success) {
          setVerificationStatus(prev => ({
            ...prev,
            aadhaar: 'success'
          }));
          
          // Update user data in context
          await refreshUser();
        } else {
          console.error('Aadhaar upload error:', aadhaarResponse.message);
          setVerificationStatus(prev => ({
            ...prev,
            aadhaar: 'error'
          }));
          setErrors(prev => ({
            ...prev,
            aadhaarFront: aadhaarResponse.message || 'Failed to process Aadhaar card'
          }));
        }
      }
      
      // Upload PAN card
      if (formData.panCard) {
        const panResponse = await uploadService.uploadPanCard(formData.panCard);
        
        if (panResponse.success) {
          setVerificationStatus(prev => ({
            ...prev,
            pan: 'success'
          }));
          
          // Update user data in context
          await refreshUser();
        } else {
          console.error('PAN upload error:', panResponse.message);
          setVerificationStatus(prev => ({
            ...prev,
            pan: 'error'
          }));
          setErrors(prev => ({
            ...prev,
            panCard: panResponse.message || 'Failed to process PAN card'
          }));
        }
      }
      
    } catch (error) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
      
      // Reset verification status on error
      setVerificationStatus({
        aadhaar: 'error',
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
      verificationStatus.aadhaar === 'success' && 
      verificationStatus.pan === 'success'
    );
  };

  const hasVerificationErrors = () => {
    return (
      verificationStatus.aadhaar === 'error' || 
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
        {/* Aadhaar Card Front Section */}
        <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Aadhaar Card (Front)</h3>
            {verificationStatus.aadhaar && (
              <StatusBadge 
                status={verificationStatus.aadhaar} 
                text={getStatusText(verificationStatus.aadhaar)} 
              />
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Please upload a clear, high-resolution image of the front side of your Aadhaar Card.
          </p>
          <FileUpload
            title="Aadhaar Card Front"
            subtitle="JPG, PNG or PDF up to 5MB"
            acceptedFileTypes=".jpg,.jpeg,.png,.pdf"
            onFileSelected={handleFileUpload('aadhaarFront')}
            error={errors.aadhaarFront}
          />
        </div>

        {/* Aadhaar Card Back Section */}
        <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Aadhaar Card (Back)</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Please upload a clear, high-resolution image of the back side of your Aadhaar Card.
          </p>
          <FileUpload
            title="Aadhaar Card Back"
            subtitle="JPG, PNG or PDF up to 5MB"
            acceptedFileTypes=".jpg,.jpeg,.png,.pdf"
            onFileSelected={handleFileUpload('aadhaarBack')}
            error={errors.aadhaarBack}
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
