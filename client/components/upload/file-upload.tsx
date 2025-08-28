'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';

interface FileUploadProps {
  title: string;
  subtitle: string;
  acceptedFileTypes: string;
  onFileSelected: (file: File) => void;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  title,
  subtitle,
  acceptedFileTypes,
  onFileSelected,
  error
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Call the callback
    onFileSelected(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mb-6">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragging ? 'border-gray-600 bg-gray-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${previewUrl ? 'border-green-300 bg-green-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          className="hidden"
          accept={acceptedFileTypes}
          onChange={handleFileInput}
          ref={fileInputRef}
        />

        {previewUrl ? (
          <div className="relative">
            <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md cursor-pointer"
                 onClick={(e) => {
                   e.stopPropagation();
                   setPreviewUrl(null);
                 }}>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="h-64 relative">
              <Image 
                src={previewUrl} 
                alt="Preview" 
                fill
                className="object-contain rounded" 
              />
            </div>
            <p className="mt-2 text-sm text-green-600">File selected. Click to replace.</p>
          </div>
        ) : (
          <>
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex flex-col items-center justify-center text-center">
              <p className="mt-1 text-sm text-gray-600">
                <span className="font-medium text-gray-900">Click to upload</span> or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
