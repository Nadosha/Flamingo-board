'use client';

import { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, Trash2 } from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { deleteCardAction } from '@/entities/card/actions';
import { getInitials } from '@/shared/lib/utils';
import type { CardWithRelations } from '@/shared/types';

interface Props {
  card: CardWithRelations;
  index: number;
  onClick: () => void;
  onDeleted: (cardId: string) => void;
}

export function CardItem({ card, index, onClick, onDeleted }: Props) {
  const [showDelete, setShowDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isOverdue =
    card.due_date && new Date(card.due_date) < new Date();

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await deleteCardAction(card.id);
      onDeleted(card.id);
    });
  }

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => {
        const cardEl = (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          onMouseEnter={() => setShowDelete(true)}
          onMouseLeave={() => setShowDelete(false)}
          className={cn(
            'group relative rounded-lg bg-card border border-border/60 p-3 cursor-pointer hover:shadow-card transition-all text-sm shadow-soft',
            snapshot.isDragging && 'shadow-card-hover rotate-1 opacity-90',
          )}
        >
          {/* Delete button */}
          {showDelete && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors z-10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Labels */}
          {card.labels && card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {card.labels.map(({ label_id, label }) => (
                <span
                  key={label_id}
                  className="h-2 w-8 rounded-full"
                  style={{ backgroundColor: label.color }}
                  title={label.name}
                />
              ))}
            </div>
          )}

          <p className="font-medium leading-snug pr-5">{card.title}</p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 gap-1">
            <div className="flex items-center gap-2">
              {/* Due date */}
              {card.due_date && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          'flex items-center gap-1 text-xs rounded px-1 py-0.5',
                          isOverdue
                            ? 'bg-destructive/10 text-destructive'
                            : 'text-muted-foreground',
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatDate(card.due_date)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isOverdue ? 'Overdue' : 'Due date'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Assignees */}
            {card.assignees && card.assignees.length > 0 && (
              <div className="flex -space-x-1.5">
                {card.assignees.slice(0, 3).map(({ user_id, profile }) => (
                  <TooltipProvider key={user_id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-5 w-5 ring-1 ring-background">
                          <AvatarImage src={profile?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[9px]">
                            {getInitials(profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>{profile?.full_name ?? 'Unknown'}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {card.assignees.length > 3 && (
                  <Avatar className="h-5 w-5 ring-1 ring-background">
                    <AvatarFallback className="text-[9px]">
                      +{card.assignees.length - 3}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
          </div>
        </div>
        );

        if (snapshot.isDragging) {
          return createPortal(cardEl, document.body);
        }
        return cardEl;
      }}
    </Draggable>
  );
}
