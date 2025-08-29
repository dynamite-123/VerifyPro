import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const signature = formData.get('signature') as File;

    if (!signature) {
      return NextResponse.json({ success: false, message: 'Signature file is required' }, { status: 400 });
    }

    const backendForm = new FormData();
    backendForm.append('signature', signature);

    const backendResponse = await fetch(`${API_URL}/signature/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: backendForm
    });

    const data = await backendResponse.json();

    return NextResponse.json({ success: backendResponse.ok, data, message: data.message || data.detail || '' }, { status: backendResponse.status });
  } catch (err: any) {
    console.error('Error proxying signature verify:', err);
    return NextResponse.json({ success: false, message: 'Failed to verify signature' }, { status: 500 });
  }
}
