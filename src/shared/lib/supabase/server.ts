import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/shared/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const storageKey = `sb-${new URL(publicUrl).hostname.split('.')[0]}-auth-token`;

  return createServerClient<Database>(
    process.env.SUPABASE_INTERNAL_URL ?? publicUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { storageKey },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component — cookies can be read but not written
          }
        },
      },
    },
  );
}

/**
 * Server-side admin client using the service role key.
 * Bypasses RLS — only use in server actions after verifying the user via createClient().
 * Uses sb_secret_* key so Kong injects the service_role JWT that PostgREST accepts.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

