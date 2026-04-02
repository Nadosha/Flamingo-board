'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authApi, ApiError } from '@/shared/lib/api/client';

const TOKEN_COOKIE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
  secure: process.env.NODE_ENV === 'production',
};

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  let token: string;
  try {
    const result = await authApi.login(email, password);
    token = result.token;
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Login failed';
    return { error: message };
  }

  const cookieStore = await cookies();
  cookieStore.set('token', token, TOKEN_COOKIE);

  const next = (formData.get('next') as string | null) ?? '/workspaces';
  redirect(next);
}

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const full_name = formData.get('full_name') as string;

  let token: string;
  try {
    const result = await authApi.register(email, password, full_name);
    token = result.token;
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Registration failed';
    return { error: message };
  }

  const cookieStore = await cookies();
  cookieStore.set('token', token, TOKEN_COOKIE);

  redirect('/workspaces');
}
