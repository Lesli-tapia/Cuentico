import { NextRequest, NextResponse } from 'next/server';
import { ApplicationError, executeCommand, getAppState, tokenHash } from '@/server/application';
import { DatabaseConfigurationError } from '@/server/database-configuration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const cookieName = 'cuentico-family';
const hashOf = (request: NextRequest) => {
  const token = request.cookies.get(cookieName)?.value;
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? tokenHash(token) : undefined;
};
const responseHeaders = { 'Cache-Control': 'no-store' };

function failure(error: unknown) {
  if (error instanceof ApplicationError) return NextResponse.json({ error: error.message }, { status: error.status, headers: responseHeaders });
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined;
  const name = error instanceof Error ? error.name : 'UnknownError';
  // Do not put connection strings or family data in hosted function logs.
  console.error('Cuentico application error:', { name, code });
  if (error instanceof DatabaseConfigurationError || name === 'PrismaClientInitializationError' || ['P1000', 'P1001', 'P1002', 'P1012', 'P1017', 'P2021', 'P2022'].includes(code ?? '')) {
    return NextResponse.json({ error: 'El guardado todavía no está disponible en este sitio. La persona responsable debe configurar la conexión de la aplicación.' }, { status: 503, headers: responseHeaders });
  }
  return NextResponse.json({ error: 'No pudimos guardar los cambios. Inténtalo de nuevo.' }, { status: 500, headers: responseHeaders });
}

export async function GET(request: NextRequest) {
  try { return NextResponse.json({ state: await getAppState(hashOf(request)) }, { headers: responseHeaders }); }
  catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  // Next's internal URL can normalize 127.0.0.1 to localhost. The browser's
  // Host header retains the actual authority that its Origin must match.
  const expectedOrigin = `${request.nextUrl.protocol}//${request.headers.get('host')}`;
  if ((origin && origin !== expectedOrigin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Esta solicitud no pertenece a Cuentico.' }, { status: 403, headers: responseHeaders });
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return NextResponse.json({ error: 'Envía los datos como JSON.' }, { status: 415, headers: responseHeaders });
  }
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 16384) return NextResponse.json({ error: 'La solicitud es demasiado grande.' }, { status: 413, headers: responseHeaders });
  try {
    const text = await request.text();
    if (text.length > 16384) return NextResponse.json({ error: 'La solicitud es demasiado grande.' }, { status: 413, headers: responseHeaders });
    const body: unknown = JSON.parse(text);
    const { newToken, ...payload } = await executeCommand(body, hashOf(request), undefined, new Date(), request.headers.get('x-cuentico-child') ?? undefined);
    const response = NextResponse.json(payload, { headers: responseHeaders });
    if (newToken) response.cookies.set(cookieName, newToken, {
      httpOnly: true, sameSite: 'strict', secure: request.nextUrl.protocol === 'https:', path: '/', maxAge: 60 * 60 * 24 * 365
    });
    return response;
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400, headers: responseHeaders });
    return failure(error);
  }
}
