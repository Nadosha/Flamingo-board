import { NextResponse } from 'next/server';
import { authApi } from '@/shared/lib/api/client';

export async function POST() {
  await authApi.logout().catch(() => {});
  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  );
  response.cookies.delete('token');
  return response;
}
