import { NextRequest, NextResponse } from 'next/server';

const getBackendCandidates = () => {
  const configured = process.env.BACKEND_URL;
  return [
    configured,
    'http://backend:8082',
    'http://localhost:8082',
    'http://127.0.0.1:8082',
  ].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);
};

async function proxy(req: NextRequest, params: { path: string[] }) {
  const backendPath = '/' + params.path.join('/');
  const search = req.nextUrl.search ?? '';
  const headers = new Headers();
  const skippedHeaders = new Set([
    'host',
    'connection',
    'content-length',
    'expect',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
  ]);

  req.headers.forEach((value, key) => {
    if (!skippedHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const body =
    req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.arrayBuffer()
      : undefined;

  for (const backend of getBackendCandidates()) {
    const url = `${backend}/api${backendPath}${search}`;
    try {
      const res = await fetch(url, {
        method: req.method,
        headers,
        body: body ? Buffer.from(body) : undefined,
      });

      const resBody = await res.arrayBuffer();
      const resHeaders = new Headers();
      res.headers.forEach((value, key) => {
        resHeaders.set(key, value);
      });

      return new NextResponse(resBody, {
        status: res.status,
        headers: resHeaders,
      });
    } catch (error) {
      console.error(`Failed to proxy ${url}`, error);
    }
  }

  return NextResponse.json(
    { message: 'Erreur de connexion au serveur backend.' },
    { status: 502 },
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
