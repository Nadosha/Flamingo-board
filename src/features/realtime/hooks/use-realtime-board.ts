'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/shared/lib/supabase/client';
import { getBoardWithColumnsAction } from '@/entities/board/actions';
import type { BoardWithColumns } from '@/shared/types';

export function useRealtimeBoard(
  boardId: string,
  onUpdate: (board: BoardWithColumns) => void,
) {
  const refetch = useCallback(async () => {
    try {
      const board = await getBoardWithColumnsAction(boardId);
      onUpdate(board);
    } catch {
      // silently fail — the optimistic update keeps UI consistent
    }
  }, [boardId, onUpdate]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
          filter: `board_id=eq.${boardId}`,
        },
        () => refetch(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
        },
        () => refetch(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_assignees',
        },
        () => refetch(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_labels',
        },
        () => refetch(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, refetch]);
}
