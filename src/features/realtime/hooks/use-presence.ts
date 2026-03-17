'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/shared/lib/supabase/client';
import type { PresenceUser } from '@/shared/types';

export function usePresence(boardId: string) {
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch profile for display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      const presencePayload: PresenceUser = {
        user_id: user.id,
        full_name: profile?.full_name ?? user.email ?? null,
        avatar_url: profile?.avatar_url ?? null,
        online_at: new Date().toISOString(),
      };

      const channel = supabase.channel(`presence:board:${boardId}`, {
        config: { presence: { key: user.id } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<PresenceUser>();
          const users = Object.values(state)
            .flat()
            .filter((u) => !!u.user_id) as PresenceUser[];

          // Deduplicate by user_id
          const seen = new Set<string>();
          const deduped = users.filter((u) => {
            if (seen.has(u.user_id)) return false;
            seen.add(u.user_id);
            return true;
          });

          setPresentUsers(deduped);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track(presencePayload);
          }
        });

      return channel;
    }

    let channelRef: ReturnType<typeof supabase.channel> | null = null;
    setup().then((ch) => {
      if (ch) channelRef = ch;
    });

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, [boardId]);

  return { presentUsers };
}
