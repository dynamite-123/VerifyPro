'use client';

import React, { useState } from 'react';
import UploadContainer from '@/components/upload/upload-container';
import FileUpload from '@/components/upload/file-upload';
import StatusBadge from '@/components/ui/status-badge';
import { uploadService } from '@/services/upload';
import { useRouter } from 'next/navigation';

export default function VerifySignaturePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Please upload a signature image to compare');

    setIsLoading(true);
    setError(null);
    setResult(null);

    const resp = await uploadService.compareSignature(file);
    setIsLoading(false);

    if (!resp.success) {
      setError(resp.message || 'Verification failed');
      return;
    }

    // normalize result shape
    const data = resp.data;
    // FastAPI returns { result: 'matched'|'unmatched', accuracy_score: number, ... }
    const normalized = {
      result: data?.result || (data?.result === undefined && data?.accuracy_score >= 0.6 ? 'matched' : 'unmatched'),
      accuracy_score: data?.accuracy_score ?? data?.accuracy ?? 0,
      analysis: data?.analysis || data?.message || ''
    };

    setResult(normalized);
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
          <h3 className="text-lg font-medium text-gray-700 mb-2">Upload Signature to Compare</h3>
          <p className="text-sm text-gray-500 mb-4">Upload a clear photo of your signature (PNG/JPG).</p>
          <FileUpload
            title="Signature Photo"
            subtitle="PNG or JPG up to 2MB"
            acceptedFileTypes=".jpg,.jpeg,.png"
            onFileSelected={handleFile}
            error={error || undefined}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-normal"
          >
            {isLoading ? 'Verifying...' : 'Verify Signature'}
          </button>
        </div>

        {result && (
          <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Signature Verification</h3>
                <p className="text-sm text-gray-500 mt-1">Comparison result and confidence score</p>
              </div>
              <div>
                <StatusBadge
                  status={result.result === 'matched' ? 'success' : 'error'}
                  text={result.result === 'matched' ? 'Matched' : 'Unmatched'}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="text-sm font-medium text-gray-800">{(result.accuracy_score * 100).toFixed(1)}%</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${result.result === 'matched' ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.max(result.accuracy_score * 100, 0), 100)}%` }}
                />
              </div>
            </div>

            {result.analysis && (
              <div className="mt-4 text-sm text-gray-700">
                <h4 className="font-medium mb-1">Analysis</h4>
                <p className="text-xs text-gray-600 whitespace-pre-wrap">{result.analysis}</p>
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg"
              >
                Go to Dashboard
              </button>
            </div>
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
