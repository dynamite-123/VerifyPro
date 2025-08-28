import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Proxy API route for document uploads
export async function POST(request: NextRequest) {
  try {
    // Get the access token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request
    const formData = await request.formData();
    const type = formData.get('type') as string;
    
    let backendUrl = '';
    let backendFormData = new FormData();
    
    // Prepare the form data based on document type
    if (type === 'aadhaar') {
      backendUrl = `${API_URL}/upload/aadhaar`;
      
      const front = formData.get('front') as File;
      const back = formData.get('back') as File;
      
      if (!front || !back) {
        return NextResponse.json(
          { success: false, message: 'Both front and back images are required' },
          { status: 400 }
        );
      }
      
      backendFormData.append('front', front);
      backendFormData.append('back', back);
    } 
    else if (type === 'pan') {
      backendUrl = `${API_URL}/upload/pan`;
      
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { success: false, message: 'PAN card image is required' },
          { status: 400 }
        );
      }
      
      backendFormData.append('file', file);
    }
    else {
      return NextResponse.json(
        { success: false, message: 'Invalid document type' },
        { status: 400 }
      );
    }
    
    // Send the request to the backend
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: backendFormData
    });
    
    // Parse the response
    let responseData;
    try {
      responseData = await backendResponse.json();
    } catch (error) {
      // Handle JSON parsing errors
      return NextResponse.json({
        success: false,
        message: 'Invalid response from server'
      }, { status: 500 });
    }
    
    // Format the response to match our expected structure
    return NextResponse.json({
      success: backendResponse.ok,
      message: responseData.message || (backendResponse.ok ? 'Upload successful' : 'Upload failed'),
      data: responseData.data
    }, { 
      status: backendResponse.status 
    });
    
  } catch (error: any) {
    console.error('Error uploading documents:', error);
    
    // Provide a more helpful error message
    let errorMessage = 'Failed to upload documents';
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      errorMessage = 'Could not connect to the server. Please check your connection or try again later.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Server took too long to respond. Please try again.';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}
