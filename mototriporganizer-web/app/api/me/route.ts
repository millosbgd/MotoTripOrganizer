import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'User endpoint - to be implemented',
    user: null 
  });
}
