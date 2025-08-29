import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function POST(request: NextRequest) {
  try {
    // Accept auth token from cookie or Authorization header
    let accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7).trim();
      }
    }

    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const backendResponse = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await backendResponse.json();
    return NextResponse.json({ success: backendResponse.ok, data: data, answer: data?.answer ?? data?.data?.answer ?? null }, { status: backendResponse.status });
  } catch (err: any) {
    console.error('Chat proxy error:', err);
    return NextResponse.json({ success: false, message: 'Failed to contact chat service' }, { status: 500 });
  }
}
