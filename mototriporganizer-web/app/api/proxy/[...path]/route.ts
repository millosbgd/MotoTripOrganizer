import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mototriporg-dev-api-cjf6c5a9dhfyf4h8.westeurope-01.azurewebsites.net';
const SECRET = new TextEncoder().encode(process.env.AUTH0_SECRET);

async function getAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('appSession');
    
    if (!sessionCookie) {
      return null;
    }

    const { payload } = await jwtVerify(sessionCookie.value, SECRET);
    
    // For now, we don't have access token stored - we'll need to get it
    // This is a simplified version - in production you'd store the access token
    return null;
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  const url = new URL(request.url);
  
  const apiUrl = `${API_URL}/api/${pathString}${url.search}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = await getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch from API' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  
  const apiUrl = `${API_URL}/api/${pathString}`;
  const body = await request.json();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = await getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to post to API' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  
  const apiUrl = `${API_URL}/api/${pathString}`;
  const body = await request.json();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = await getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update API' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  
  const apiUrl = `${API_URL}/api/${pathString}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = await getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers,
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({}, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete from API' },
      { status: 500 }
    );
  }
}
