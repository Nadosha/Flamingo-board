'use server';

import { createClient, createAdminClient } from '@/shared/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createColumnAction(boardId: string, name: string, position: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { data, error } = await db
    .from('columns')
    .insert({ board_id: boardId, name, position })
    .select()
    .single();

  if (error) return { error: error.message };
  return { column: data };
}

export async function updateColumnAction(
  columnId: string,
  updates: { name?: string; position?: number },
) {
  const db = createAdminClient();
  const { error } = await db
    .from('columns')
    .update(updates)
    .eq('id', columnId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteColumnAction(columnId: string) {
  const db = createAdminClient();
  const { error } = await db.from('columns').delete().eq('id', columnId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function reorderColumnsAction(
  updates: Array<{ id: string; position: number }>,
) {
  const db = createAdminClient();
  const promises = updates.map(({ id, position }) =>
    db.from('columns').update({ position }).eq('id', id),
  );
  await Promise.all(promises);
  return { success: true };
}
