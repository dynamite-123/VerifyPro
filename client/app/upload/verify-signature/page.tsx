'use client';

import React, { useState } from 'react';
import UploadContainer from '@/components/upload/upload-container';
import FileUpload from '@/components/upload/file-upload';
import StatusBadge from '@/components/ui/status-badge';
import { uploadService } from '@/services/upload';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { otpService } from '@/services/api';

export default function VerifySignaturePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [otpImageFile, setOtpImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otpResult, setOtpResult] = useState<any>(null);
  const [signatureResult, setSignatureResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignatureFile = (f: File) => {
    setSignatureFile(f);
    setError(null);
    setSignatureResult(null);
  };

  const handleOtpImageFile = (f: File) => {
    setOtpImageFile(f);
    setError(null);
    setOtpResult(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    // This handler will be used only for the final signature verification
    if (!signatureFile) {
      setError('Please upload a signature image to compare');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSignatureResult(null);

    try {
      const signatureResp = await uploadService.compareSignature(signatureFile);

      if (!signatureResp.success) {
        setError(signatureResp.message || 'Signature verification failed');
        return;
      }

      const data = signatureResp.data;
      const normalized = {
        result: data?.result || (data?.result === undefined && data?.accuracy_score >= 0.6 ? 'matched' : 'unmatched'),
        accuracy_score: data?.accuracy_score ?? data?.accuracy ?? 0,
        analysis: data?.analysis || data?.message || ''
      };

      setSignatureResult(normalized);
    } catch (error: any) {
      console.error('Error during signature verification:', error);
      setError(error.message || 'Signature verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpImageFile) {
      setError('Please upload an OTP image for verification');
      return;
    }

    if (!user?.email) {
      setError('User email not found');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOtpResult(null);

    try {
      const otpResponse = await otpService.verifyOtpImage(user.email, otpImageFile);
      setOtpResult({
        success: otpResponse.data?.success || (otpResponse.data?.data?.verified ?? false),
        message: otpResponse.data?.message || 'OTP verification completed'
      });
    } catch (error: any) {
      console.error('Error during OTP verification:', error);
      setError(error.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UploadContainer title="Compare Signature" subtitle="Upload a signature photo to compare with your extracted signature">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p className="text-sm text-white">Verifying signature — please hold on</p>
          </div>
        </div>
      )}
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-2">OTP Verification</h3>
          <p className="text-sm text-gray-500 mb-4">Upload a photo of the OTP sent to your email for verification.</p>
          <FileUpload
            title="OTP Image"
            subtitle="PNG or JPG up to 2MB"
            acceptedFileTypes=".jpg,.jpeg,.png"
            onFileSelected={handleOtpImageFile}
            error={error || undefined}
          />
          <div className="mt-4">
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isLoading}
              className=" w-full px-4 py-2 bg-slate-900 text-white rounded-md"
            >
              {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
            </button>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Signature Verification</h3>
          <p className="text-sm text-gray-500 mb-4">Upload a signature photo to compare with your extracted signature.</p>
          <FileUpload
            title="Signature Photo"
            subtitle="PNG or JPG up to 2MB"
            acceptedFileTypes=".jpg,.jpeg,.png"
            onFileSelected={handleSignatureFile}
            error={error || undefined}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || !otpResult?.success}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-normal"
          >
            {isLoading ? 'Verifying...' : 'Verify Signature'}
          </button>
          {!otpResult?.success && (
            <p className="text-xs text-gray-500 mt-2">You must successfully verify OTP before signature comparison.</p>
          )}
        </div>

        {otpResult && (
          <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">OTP Verification</h3>
                <p className="text-sm text-gray-500 mt-1">OCR-based OTP verification result</p>
              </div>
              <div>
                <StatusBadge
                  status={otpResult.success ? 'success' : 'error'}
                  text={otpResult.success ? 'Verified' : 'Failed'}
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-700">{otpResult.message}</p>
            </div>
          </div>
        )}

        {signatureResult && (
          <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Signature Verification</h3>
                <p className="text-sm text-gray-500 mt-1">Comparison result and confidence score</p>
              </div>
              <div>
                <StatusBadge
                  status={signatureResult.result === 'matched' ? 'success' : 'error'}
                  text={signatureResult.result === 'matched' ? 'Matched' : 'Unmatched'}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="text-sm font-medium text-gray-800">{(signatureResult.accuracy_score * 100).toFixed(1)}%</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${signatureResult.result === 'matched' ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.max(signatureResult.accuracy_score * 100, 0), 100)}%` }}
                />
              </div>
            </div>

            {signatureResult.analysis && (
              <div className="mt-4 text-sm text-gray-700">
                <h4 className="font-medium mb-1">Analysis</h4>
                <p className="text-xs text-gray-600 whitespace-pre-wrap">{signatureResult.analysis}</p>
              </div>
            )}
          </div>
        )}

        {otpResult && signatureResult && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-100 text-red-500 rounded-lg text-xs font-light">
            {error}
          </div>
        )}
      </form>
    </UploadContainer>
  );
}
