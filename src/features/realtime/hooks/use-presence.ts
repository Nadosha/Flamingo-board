'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/shared/lib/api/client';
import type { PresenceUser } from '@/shared/types';

// Reuse the singleton socket from use-realtime-board
function getSocket() {
  const { getSocket: get } = require('./use-realtime-board');
  return get ? get() : null;
}

export function usePresence(boardId: string) {
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    let socket: any;
    let userPayload: PresenceUser | null = null;

    async function setup() {
      const { io } = await import('socket.io-client');
      const url = (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:4000');

      // Identify ourselves
      try {
        const me = await authApi.me();
        userPayload = {
          user_id: me.id,
          full_name: me.full_name,
          avatar_url: me.avatar_url,
          online_at: new Date().toISOString(),
        };
      } catch {
        userPayload = { user_id: 'anon', full_name: null, avatar_url: null, online_at: new Date().toISOString() };
      }

      socket = io(`${url}/realtime`, { withCredentials: true, autoConnect: true });

      socket.emit('join-board', { boardId, user: userPayload });

      socket.on('presence-update', (users: PresenceUser[]) => {
        setPresentUsers(users);
      });
    }

    setup();

    return () => {
      if (socket) {
        socket.emit('leave-board', boardId);
        socket.off('presence-update');
        socket.disconnect();
      }
    };
  }, [boardId]);

  return { presentUsers };
}
