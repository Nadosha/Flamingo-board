'use server';

import { createClient, createAdminClient } from '@/shared/lib/supabase/server';
import type { BoardWithColumns } from '@/shared/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getBoardsAction(workspaceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { data, error } = await db
    .from('boards')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createBoardAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = (formData.get('name') as string).trim();
  const workspaceId = formData.get('workspace_id') as string;
  const color = (formData.get('color') as string) || '#0079bf';
  const description = formData.get('description') as string | null;

  if (!name || !workspaceId) return { error: 'Name and workspace are required' };

  const db = createAdminClient();
  const { data, error } = await db
    .from('boards')
    .insert({ name, workspace_id: workspaceId, color, description, created_by: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/workspaces/${workspaceId}`);
  return { board: data };
}

export async function deleteBoardAction(boardId: string, workspaceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { error } = await db.from('boards').delete().eq('id', boardId);
  if (error) return { error: error.message };

  revalidatePath(`/workspaces/${workspaceId}`);
  return { success: true };
}

export async function getBoardWithColumnsAction(boardId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { data, error } = await db
    .from('boards')
    .select(`
      *,
      columns (
        *,
        cards (
          *,
          card_assignees ( user_id, profile:profiles(id, full_name, avatar_url) ),
          card_labels ( label_id, label:labels(*) )
        )
      )
    `)
    .eq('id', boardId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Board not found');

  // Sort columns and cards by position
  const sorted: BoardWithColumns = {
    ...(data as unknown as BoardWithColumns),
    columns: ((data as unknown as { columns: Array<{ position: number; cards?: Array<{ position: number }> }> }).columns ?? [])
      .sort((a, b) => a.position - b.position)
      .map((col) => ({
        ...(col as unknown as BoardWithColumns['columns'][number]),
        cards: (col.cards ?? []).sort((a, b) => a.position - b.position) as BoardWithColumns['columns'][number]['cards'],
      })),
  };

  return sorted;
}
