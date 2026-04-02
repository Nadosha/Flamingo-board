'use client';

import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { boardsApi } from '@/shared/lib/api/client';
import type { BoardWithColumns } from '@/shared/types';

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:4000';
    socket = io(`${url}/realtime`, { withCredentials: true, autoConnect: true });
  }
  return socket;
}

export function useRealtimeBoard(
  boardId: string,
  onUpdate: (board: BoardWithColumns) => void,
) {
  // Keep latest onUpdate in a ref so it never triggers effect re-runs
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; });

  const refetch = useCallback(async () => {
    try {
      const board = await boardsApi.getWithColumns(boardId);
      onUpdateRef.current(board as BoardWithColumns);
    } catch {
      // silently fail — the optimistic update keeps UI consistent
    }
  }, [boardId]); // onUpdate intentionally excluded via ref

  useEffect(() => {
    const s = getSocket();

    s.emit('join-board', { boardId });

    const handleUpdate = ({ boardId: updatedId }: { boardId: string }) => {
      if (updatedId === boardId) refetch();
    };

    s.on('board-updated', handleUpdate);

    return () => {
      s.off('board-updated', handleUpdate);
      s.emit('leave-board', boardId);
    };
  }, [boardId, refetch]);
}

