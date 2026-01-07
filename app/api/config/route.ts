import { NextResponse } from 'next/server';

export async function GET() {
  // Read API URL from environment variable (available at runtime in Docker)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090';
  
  return NextResponse.json({
    apiUrl,
  });
}

