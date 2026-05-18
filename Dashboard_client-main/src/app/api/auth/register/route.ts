import { NextResponse } from 'next/server';

const backendCandidates = process.env.BACKEND_URL
  ? [process.env.BACKEND_URL]
  : [
      'http://127.0.0.1:8082',
      'http://localhost:8082',
      'http://127.0.0.1:8081',
      'http://localhost:8081',
    ];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    for (const baseUrl of backendCandidates) {
      try {
        const response = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } catch {
        // Try next backend candidate.
      }
    }

    throw new Error('All backend candidates failed');

  } catch (error) {
    console.error('❌ Register proxy error:', error);
    return NextResponse.json(
      { message: 'Erreur de connexion au serveur.' },
      { status: 500 }
    );
  }
}