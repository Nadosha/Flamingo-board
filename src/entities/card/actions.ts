'use server';

import { createClient, createAdminClient } from '@/shared/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createCardAction(
  columnId: string,
  title: string,
  position: number,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { data, error } = await db
    .from('cards')
    .insert({ column_id: columnId, title, position, created_by: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  await db.from('card_activities').insert({
    card_id: data.id,
    user_id: user.id,
    type: 'card_created',
    content: `Created card "${title}"`,
  });

  return { card: data };
}

export async function updateCardAction(
  cardId: string,
  updates: {
    title?: string;
    description?: string;
    column_id?: string;
    position?: number;
    due_date?: string | null;
  },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { data, error } = await db
    .from('cards')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single();

  if (error) return { error: error.message };

  if (updates.description !== undefined) {
    await db.from('card_activities').insert({
      card_id: cardId,
      user_id: user.id,
      type: 'card_updated',
      content: 'Updated card description',
    });
  }

  return { card: data };
}

export async function moveCardAction(
  cardId: string,
  targetColumnId: string,
  targetPosition: number,
  sourceColumnId: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { error } = await db
    .from('cards')
    .update({
      column_id: targetColumnId,
      position: targetPosition,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId);

  if (error) return { error: error.message };

  if (sourceColumnId !== targetColumnId) {
    await db.from('card_activities').insert({
      card_id: cardId,
      user_id: user.id,
      type: 'card_moved',
      content: 'Moved card to another column',
      metadata: { from_column: sourceColumnId, to_column: targetColumnId },
    });
  }

  return { success: true };
}

export async function reorderCardsAction(
  updates: Array<{ id: string; column_id: string; position: number }>,
) {
  const db = createAdminClient();
  const promises = updates.map(({ id, column_id, position }) =>
    db.from('cards').update({ column_id, position }).eq('id', id),
  );
  await Promise.all(promises);
  return { success: true };
}

export async function deleteCardAction(cardId: string) {
  const db = createAdminClient();
  const { error } = await db.from('cards').delete().eq('id', cardId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getCardWithRelationsAction(cardId: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from('cards')
    .select(`
      *,
      card_assignees ( user_id, profile:profiles(id, full_name, avatar_url) ),
      card_labels ( label_id, label:labels(*) ),
      card_activities ( *, profile:profiles(id, full_name, avatar_url) )
    `)
    .eq('id', cardId)
    .single();

  if (error) return null;
  return data;
}

export async function addCardAssigneeAction(cardId: string, userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { error } = await db
    .from('card_assignees')
    .upsert({ card_id: cardId, user_id: userId });

  if (error) return { error: error.message };

  await db.from('card_activities').insert({
    card_id: cardId,
    user_id: user.id,
    type: 'assignee_added',
    content: 'Added assignee',
    metadata: { assignee_id: userId },
  });

  return { success: true };
}

export async function removeCardAssigneeAction(cardId: string, userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { error } = await db
    .from('card_assignees')
    .delete()
    .eq('card_id', cardId)
    .eq('user_id', userId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function addCommentAction(cardId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  const { error } = await db.from('card_activities').insert({
    card_id: cardId,
    user_id: user.id,
    type: 'card_commented',
    content,
  });

  if (error) return { error: error.message };
  return { success: true };
}

