'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { getInitials } from '@/shared/lib/utils';
import type { PresenceUser } from '@/shared/types';

interface Props {
  users: PresenceUser[];
}

export function PresenceBar({ users }: Props) {
  if (users.length === 0) return null;

  const visible = users.slice(0, 5);
  const overflow = users.length - 5;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Viewing:</span>
        <div className="flex -space-x-1.5">
          {visible.map((user) => (
            <Tooltip key={user.user_id}>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6 ring-2 ring-background cursor-default">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{user.full_name ?? 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">Online now</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {overflow > 0 && (
            <Avatar className="h-6 w-6 ring-2 ring-background">
              <AvatarFallback className="text-[10px]">+{overflow}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
