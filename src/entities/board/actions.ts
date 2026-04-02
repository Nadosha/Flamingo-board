'use server';

import { boardsApi, ApiError } from '@/shared/lib/api/client';
import type { BoardWithColumns } from '@/shared/types';
import { revalidatePath } from 'next/cache';

export async function getBoardsAction(workspaceId: string) {
  try {
    return await boardsApi.list(workspaceId);
  } catch {
    return [];
  }
}

export async function createBoardAction(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const workspaceId = formData.get('workspace_id') as string;
  const color = (formData.get('color') as string) || '#0079bf';
  const description = (formData.get('description') as string) || undefined;

  if (!name || !workspaceId) return { error: 'Name and workspace are required' };

  try {
    const board = await boardsApi.create({ name, workspace_id: workspaceId, color, description });
    revalidatePath(`/workspaces/${workspaceId}`);
    return { board };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to create board';
    return { error: message };
  }
}

export async function deleteBoardAction(boardId: string, workspaceId: string) {
  try {
    await boardsApi.delete(boardId);
    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to delete board';
    return { error: message };
  }
}

export async function getBoardWithColumnsAction(boardId: string): Promise<BoardWithColumns> {
  const data = await boardsApi.getWithColumns(boardId);
  return data as BoardWithColumns;
}
