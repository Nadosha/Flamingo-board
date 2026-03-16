'use server';

import { createClient, createAdminClient } from '@/shared/lib/supabase/server';
import { slugify } from '@/shared/lib/utils';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getWorkspacesAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { data, error } = await db
    .from('workspace_members')
    .select('role, workspace:workspaces(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createWorkspaceAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = (formData.get('name') as string).trim();
  if (!name) return { error: 'Name is required' };

  const baseSlug = slugify(name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const db = createAdminClient();
  const { data, error } = await db
    .from('workspaces')
    .insert({ name, slug, owner_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/workspaces');
  redirect('/workspaces');
}

export async function deleteWorkspaceAction(workspaceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { error } = await db
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)
    .eq('owner_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/workspaces');
  return { success: true };
}

export async function acceptInviteAction(token: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/invite/${token}`);

  const db = createAdminClient();
  const { data: invite, error: inviteError } = await db
    .from('workspace_invites')
    .select('*')
    .eq('token', token)
    .single();

  if (inviteError || !invite) return { error: 'Invalid or expired invite link' };
  if (new Date(invite.expires_at) < new Date()) return { error: 'Invite link has expired' };

  const { error } = await db
    .from('workspace_members')
    .upsert({ workspace_id: invite.workspace_id, user_id: user.id, role: 'member' });

  if (error) return { error: error.message };

  redirect(`/workspaces/${invite.workspace_id}`);
}

export async function createInviteAction(workspaceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { data, error } = await db
    .from('workspace_invites')
    .insert({ workspace_id: workspaceId, invited_by: user.id })
    .select('token')
    .single();

  if (error) return { error: error.message };

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.token}`;
  return { url: inviteUrl };
}
