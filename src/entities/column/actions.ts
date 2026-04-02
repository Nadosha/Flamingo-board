'use server';

import { columnsApi, ApiError } from '@/shared/lib/api/client';

export async function createColumnAction(boardId: string, name: string, position: number) {
  try {
    const column = await columnsApi.create(boardId, name, position);
    return { column };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to create column';
    return { error: message };
  }
}

export async function updateColumnAction(
  columnId: string,
  updates: { name?: string; position?: number },
) {
  try {
    await columnsApi.update(columnId, updates);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to update column';
    return { error: message };
  }
}

export async function deleteColumnAction(columnId: string) {
  try {
    await columnsApi.delete(columnId);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to delete column';
    return { error: message };
  }
}

export async function reorderColumnsAction(
  updates: Array<{ id: string; position: number }>,
  boardId?: string,
) {
  try {
    await columnsApi.reorder(updates, boardId);
    return { success: true };
  } catch {
    return { success: true };
  }
}
