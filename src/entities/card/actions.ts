'use server';

import { cardsApi, boardsApi, labelsApi, ApiError } from '@/shared/lib/api/client';

export async function createCardAction(
  columnId: string,
  title: string,
  position: number,
) {
  try {
    const card = await cardsApi.create(columnId, title, position);
    return { card };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to create card';
    return { error: message };
  }
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
  try {
    const card = await cardsApi.update(cardId, updates);
    return { card };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to update card';
    return { error: message };
  }
}

export async function moveCardAction(
  cardId: string,
  targetColumnId: string,
  targetPosition: number,
  sourceColumnId: string,
) {
  try {
    await cardsApi.move(cardId, targetColumnId, targetPosition, sourceColumnId);
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function reorderCardsAction(
  updates: Array<{ id: string; column_id: string; position: number }>,
  boardId?: string,
) {
  try {
    await cardsApi.reorder(updates, boardId);
  } catch {
    // silently ignore — optimistic update already applied
  }
  return { success: true };
}

export async function deleteCardAction(cardId: string) {
  try {
    await cardsApi.delete(cardId);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to delete card';
    return { error: message };
  }
}

export async function getCardWithRelationsAction(cardId: string) {
  try {
    return await cardsApi.get(cardId);
  } catch {
    return null;
  }
}

export async function addCardAssigneeAction(cardId: string, userId: string) {
  try {
    await cardsApi.addAssignee(cardId, userId);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to add assignee';
    return { error: message };
  }
}

export async function removeCardAssigneeAction(cardId: string, userId: string) {
  try {
    await cardsApi.removeAssignee(cardId, userId);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to remove assignee';
    return { error: message };
  }
}

export async function addCardLabelAction(cardId: string, labelId: string) {
  try {
    await cardsApi.addLabel(cardId, labelId);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to add label';
    return { error: message };
  }
}

export async function removeCardLabelAction(cardId: string, labelId: string) {
  try {
    await cardsApi.removeLabel(cardId, labelId);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to remove label';
    return { error: message };
  }
}

export async function getBoardMembersAction(boardId: string) {
  try {
    return await boardsApi.getMembers(boardId);
  } catch {
    return [];
  }
}

export async function getBoardLabelsAction(boardId: string) {
  try {
    return await boardsApi.getLabels(boardId);
  } catch {
    return [];
  }
}

export async function createLabelAction(boardId: string, name: string, color: string) {
  try {
    // We need workspace_id — fetch board first to get it
    const board = await boardsApi.getWithColumns(boardId);
    const label = await labelsApi.create(board.workspace_id, name, color);
    return { label };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to create label';
    return { error: message };
  }
}

export async function deleteLabelAction(labelId: string) {
  try {
    await labelsApi.delete(labelId);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to delete label';
    return { error: message };
  }
}

export async function addCommentAction(cardId: string, content: string) {
  try {
    await cardsApi.addComment(cardId, content);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to add comment';
    return { error: message };
  }
}
