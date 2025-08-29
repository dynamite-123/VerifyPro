import api from './api';

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    url?: string;
    verification?: {
      status: string;
      message?: string;
    };
    extractedData?: any;
  };
}

// Upload service for document uploads
export const uploadService = {
  // Upload Aadhaar card (front and back)
  uploadAadhaarCard: async (frontImage: File, backImage: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('type', 'aadhaar');
      formData.append('front', frontImage);
      formData.append('back', backImage);
      
  // Forward access token from localStorage if cookie isn't available to the Next proxy
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const response = await fetch('/api/upload-documents', {
    method: 'POST',
    body: formData,
    headers,
    // include cookies if present in the browser
    credentials: 'include'
  });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.warn('Aadhaar upload failed:', data);
        return {
          success: false,
          message: data.message || 'Failed to upload Aadhaar card. Please try again later.'
        };
      }
      
      return data;
    } catch (error: any) {
      console.error('Error uploading Aadhaar card:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload Aadhaar card. Please check your connection and try again.'
      };
    }
  },
  
  // Upload PAN card
  uploadPanCard: async (panImage: File, signature?: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('type', 'pan');
      formData.append('file', panImage);
      
      // Add signature if provided
      if (signature) {
        formData.append('signature', signature);
      }
      
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const response = await fetch('/api/upload-documents', {
    method: 'POST',
    body: formData,
    headers,
    credentials: 'include'
  });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.warn('PAN upload failed:', data);
        return {
          success: false,
          message: data.message || 'Failed to upload PAN card. Please try again later.'
        };
      }
      
      return data;
    } catch (error: any) {
      console.error('Error uploading PAN card:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload PAN card. Please check your connection and try again.'
      };
    }
  },
  
  // Get user verification status
  getVerificationStatus: async () => {
    try {
      const response = await api.get('/user/verification-status');
      return response.data;
    } catch (error: any) {
      console.error('Error getting verification status:', error);
      throw error;
    }
  }
  ,

  // Compare user extracted signature with a newly uploaded signature via server
  compareSignature: async (signatureFile: File) => {
    try {
      const formData = new FormData();
      formData.append('signature', signatureFile);

  // Use the Next API proxy to forward request to backend
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const response = await fetch('/api/signature/verify', {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || data.detail || 'Signature verification failed' };
      }

      // The Next proxy returns a wrapper { success, data, message } where data is the backend payload.
      // Unwrap so callers receive the backend response directly.
      const backendPayload = data?.data ?? data;
      return { success: true, data: backendPayload };
    } catch (error: any) {
      console.error('Error comparing signature:', error);
      return { success: false, message: error.message || 'Network error' };
    }
  }
};

export default uploadService;
