'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Image from 'next/image';

interface SignatureCropProps {
  panImage: File | null;
  onSignatureExtracted: (signature: File) => void;
}

function SignatureCrop({ panImage, onSignatureExtracted }: SignatureCropProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [panImageUrl, setPanImageUrl] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const panImageFileRef = useRef<File | null>(null);

  // Handler for crop change
  const handleCropChange = useCallback((c: Crop) => setCrop(c), []);
  
  // Handler for crop completion
  const handleCropComplete = useCallback((c: PixelCrop) => setCompletedCrop(c), []);
  
  // Handlers for brightness and contrast
  const handleBrightnessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
    setBrightness(Number(e.target.value)), []);
    
  const handleContrastChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
    setContrast(Number(e.target.value)), []);

  // Load PAN card image when file is provided
  useEffect(() => {
    // Only create a new URL if the file has changed
    if (panImage && panImage !== panImageFileRef.current) {
      // Clean up previous URL if it exists
      if (panImageUrl) {
        URL.revokeObjectURL(panImageUrl);
      }
      
      const url = URL.createObjectURL(panImage);
      setPanImageUrl(url);
      panImageFileRef.current = panImage;
      
      // Reset signature preview when PAN image changes
      setSignaturePreview(null);
    }
    
    // Clean up function
    return () => {
      if (panImageUrl) {
        URL.revokeObjectURL(panImageUrl);
      }
    };
  }, [panImage]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    imageRef.current = e.currentTarget;
    
    // Initialize crop at the bottom area of the PAN card where signature is typically located
    const initialCrop: Crop = {
      unit: '%',
      x: 30,
      y: 70,
      width: 40,
      height: 10
    };
    
    setCrop(initialCrop);
  }, []);

  // Cleanup all URLs when component unmounts
  useEffect(() => {
    return () => {
      if (panImageUrl) {
        URL.revokeObjectURL(panImageUrl);
      }
      if (signaturePreview) {
        URL.revokeObjectURL(signaturePreview);
      }
    };
  }, [panImageUrl, signaturePreview]);

  const extractSignature = useCallback(async () => {
    if (!completedCrop || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const image = imageRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply image adjustments
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    
    // Clean up previous preview if it exists
    if (signaturePreview) {
      URL.revokeObjectURL(signaturePreview);
    }

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(blob);
      setSignaturePreview(previewUrl);
      
      // Create a File from the blob
      const signatureFile = new File([blob], 'signature.png', { type: 'image/png' });
      
      // Call the callback with the extracted signature
      onSignatureExtracted(signatureFile);
    }, 'image/png');
  }, [completedCrop, brightness, contrast, onSignatureExtracted, signaturePreview]);

  // Function to reset the signature extraction
  const resetSignatureExtraction = useCallback(() => {
    // Clean up the preview URL
    if (signaturePreview) {
      URL.revokeObjectURL(signaturePreview);
      setSignaturePreview(null);
    }
    
    // Reset the onSignatureExtracted callback by passing null
    onSignatureExtracted(null as any);
  }, [signaturePreview, onSignatureExtracted]);

  if (!panImage) {
    return <div className="p-4 text-center text-gray-500">Please upload a PAN card image first</div>;
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Crop Signature from PAN Card</h3>
        
        {/* Image Adjustment Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Brightness ({brightness}%)</label>
            <input
              type="range"
              min="50"
              max="150"
              value={brightness}
              onChange={handleBrightnessChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contrast ({contrast}%)</label>
            <input
              type="range"
              min="50"
              max="150"
              value={contrast}
              onChange={handleContrastChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        
        {panImageUrl && (
          <div className="max-h-80 overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={handleCropChange}
              onComplete={handleCropComplete}
              className="max-w-full"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%)`
              }}
            >
              <img 
                src={panImageUrl} 
                alt="PAN Card" 
                onLoad={onImageLoad}
                className="max-w-full"
              />
            </ReactCrop>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Adjust the crop box to select your signature area from the PAN card
        </p>
      </div>

      {completedCrop && (
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={extractSignature}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-normal"
          >
            Extract Signature
          </button>
        </div>
      )}

      {signaturePreview && (
        <div className="mt-4 border rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Extracted Signature</h3>
          <div className="h-24 relative border border-gray-200 rounded">
            <Image
              src={signaturePreview}
              alt="Extracted Signature"
              fill
              className="object-contain"
            />
          </div>
          <p className="mt-2 text-xs text-green-600">
            Signature extracted successfully
          </p>
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={resetSignatureExtraction}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-all"
            >
              Re-crop Signature
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignatureCrop;
